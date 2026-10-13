import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { useTestDatabase } from './helpers/db.js';
import {
  createAdmin,
  getRefreshCookie,
  registerCustomer,
  validCustomer,
} from './helpers/auth.js';

useTestDatabase();
const app = createApp();

describe('Registro', () => {
  it('crea una clienta, devuelve token de acceso y guarda la sesión en una cookie segura', async () => {
    const { res, cookie } = await registerCustomer(app);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({
      name: validCustomer.name,
      email: validCustomer.email,
      phone: '7777-8888',
      role: 'customer',
    });
    expect(res.body.user.passwordHash).toBeUndefined();

    const setCookie = res.headers['set-cookie'].join(';');
    expect(cookie).toBeTruthy();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Path=\/api\/auth/);
  });

  it('ignora role: "admin" en el cuerpo y la cuenta no puede entrar a /api/admin', async () => {
    const { res, token } = await registerCustomer(app, { role: 'admin' });
    expect(res.body.user.role).toBe('customer');

    const stored = await User.findOne({ email: validCustomer.email });
    expect(stored.role).toBe('customer');

    const admin = await request(app).get('/api/admin').set('Authorization', `Bearer ${token}`);
    expect(admin.status).toBe(403);
  });

  it('guarda la contraseña con bcrypt (costo 12), nunca en texto plano', async () => {
    await registerCustomer(app);
    const stored = await User.findOne({ email: validCustomer.email }).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(stored.passwordHash).not.toContain(validCustomer.password);
  });

  it('normaliza el correo a minúsculas y rechaza duplicados', async () => {
    await registerCustomer(app, { email: 'Maria@Example.com' });
    const { res } = await registerCustomer(app, { email: 'MARIA@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Ya existe una cuenta con ese correo');
  });

  it.each([
    ['contraseña corta', { password: 'Ab1' }],
    ['contraseña sin números', { password: 'SoloLetras' }],
    ['contraseña sin letras', { password: '12345678' }],
    ['correo inválido', { email: 'no-es-correo' }],
    ['teléfono inválido', { phone: '123' }],
    ['nombre vacío', { name: ' ' }],
  ])('rechaza datos inválidos: %s', async (_caso, overrides) => {
    const { res } = await registerCustomer(app, overrides);
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('acepta el teléfono con código de país y lo guarda como 7777-7777', async () => {
    const { res } = await registerCustomer(app, { phone: '+503 6123 4567' });
    expect(res.body.user.phone).toBe('6123-4567');
  });
});

describe('Inicio de sesión', () => {
  it('inicia sesión con datos correctos', async () => {
    await registerCustomer(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'MARIA@example.com', password: validCustomer.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(getRefreshCookie(res)).toBeTruthy();
  });

  it('usa el mismo mensaje genérico si el correo no existe o la contraseña es incorrecta', async () => {
    await registerCustomer(app);
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: validCustomer.email, password: 'Incorrecta1' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@example.com', password: 'Incorrecta1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Correo o contraseña incorrectos');
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('bloquea la inyección NoSQL en el login', async () => {
    await registerCustomer(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.accessToken).toBeUndefined();
  });
});

describe('Token de acceso', () => {
  it('GET /auth/me devuelve la usuaria con un token válido', async () => {
    const { token } = await registerCustomer(app);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validCustomer.email);
  });

  it('rechaza peticiones sin token, con token manipulado o vencido', async () => {
    const { res: registered, token } = await registerCustomer(app);

    const noToken = await request(app).get('/api/auth/me');
    const tampered = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token.slice(0, -2)}xx`);
    const forged = jwt.sign({ sub: registered.body.user.id, role: 'admin' }, 'otro-secreto');
    const forgedRes = await request(app).get('/api/admin').set('Authorization', `Bearer ${forged}`);
    const expired = jwt.sign(
      { sub: registered.body.user.id, role: 'customer', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_ACCESS_SECRET,
      { issuer: 'abrakadabra-api', audience: 'abrakadabra-web' },
    );
    const expiredRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    for (const res of [noToken, tampered, forgedRes, expiredRes]) {
      expect(res.status).toBe(401);
    }
  });
});

describe('Refresh token con rotación', () => {
  it('entrega una nueva sesión y un refresh token distinto', async () => {
    const { cookie } = await registerCustomer(app);
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user.email).toBe(validCustomer.email);
    const newCookie = getRefreshCookie(res);
    expect(newCookie).toBeTruthy();
    expect(newCookie).not.toBe(cookie);
  });

  it('nunca guarda el refresh token en texto plano', async () => {
    const { cookie } = await registerCustomer(app);
    const rawToken = cookie.split('=')[1];
    const stored = await RefreshToken.findOne();
    expect(stored.tokenHash).not.toBe(rawToken);
    expect(await RefreshToken.findOne({ tokenHash: rawToken })).toBeNull();
  });

  it('detecta la reutilización de un token viejo y cierra toda la familia de sesiones', async () => {
    const { cookie: oldCookie } = await registerCustomer(app);
    const first = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    const newCookie = getRefreshCookie(first);

    // Simula que pasó el margen de gracia desde la rotación
    await RefreshToken.updateMany(
      { revokedAt: mongoose.trusted({ $ne: null }) },
      { revokedAt: new Date(Date.now() - 60_000) },
    );

    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(reuse.status).toBe(401);

    // El token legítimo más reciente también quedó invalidado
    const afterReuse = await request(app).post('/api/auth/refresh').set('Cookie', newCookie);
    expect(afterReuse.status).toBe(401);
  });

  it('tolera dos renovaciones simultáneas (dos pestañas) dentro del margen de gracia', async () => {
    const { cookie } = await registerCustomer(app);
    const [a, b] = await Promise.all([
      request(app).post('/api/auth/refresh').set('Cookie', cookie),
      request(app).post('/api/auth/refresh').set('Cookie', cookie),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });

  it('responde 401 sin cookie o con un token inventado', async () => {
    const none = await request(app).post('/api/auth/refresh');
    const fake = await request(app).post('/api/auth/refresh').set('Cookie', 'abk_rt=inventado');
    expect(none.status).toBe(401);
    expect(fake.status).toBe(401);
  });
});

describe('Cierre de sesión', () => {
  it('invalida el refresh token y borra la cookie', async () => {
    const { cookie } = await registerCustomer(app);
    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie);

    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie'].join(';')).toMatch(/abk_rt=;/);

    const refresh = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refresh.status).toBe(401);
  });
});

describe('Rutas de administración', () => {
  it('responden 401 sin sesión, 403 a clientas y 200 a admins', async () => {
    const { token: customerToken } = await registerCustomer(app);
    const { token: adminToken } = await createAdmin(app);

    const anonymous = await request(app).get('/api/admin');
    const customer = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${customerToken}`);
    const admin = await request(app).get('/api/admin').set('Authorization', `Bearer ${adminToken}`);

    expect(anonymous.status).toBe(401);
    expect(customer.status).toBe(403);
    expect(admin.status).toBe(200);
  });

  it('si a una admin se le quita el rol, pierde el acceso de inmediato aunque su token siga vigente', async () => {
    const { token } = await createAdmin(app);
    await User.updateOne({ email: 'admin@example.com' }, { role: 'customer' });
    const res = await request(app).get('/api/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Mi cuenta', () => {
  it('actualiza nombre y teléfono, e ignora intentos de cambiar rol o correo', async () => {
    const { token } = await registerCustomer(app);
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'María José', phone: '22223333', role: 'admin', email: 'otro@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'María José',
      phone: '2222-3333',
      role: 'customer',
      email: validCustomer.email,
    });
  });

  it('cambia la contraseña y cierra las sesiones anteriores', async () => {
    const { token, cookie } = await registerCustomer(app);

    const wrong = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Incorrecta1', newPassword: 'NuevaClave99' });
    expect(wrong.status).toBe(400);

    const ok = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: validCustomer.password, newPassword: 'NuevaClave99' });
    expect(ok.status).toBe(200);

    const oldSession = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(oldSession.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: validCustomer.email, password: 'NuevaClave99' });
    expect(login.status).toBe(200);
  });
});
