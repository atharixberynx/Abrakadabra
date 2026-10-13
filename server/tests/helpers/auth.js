/** Utilidades para pruebas que necesitan cuentas y sesiones */
import request from 'supertest';
import { User } from '../../src/models/User.js';
import { hashPassword } from '../../src/services/authService.js';
import { REFRESH_COOKIE_NAME } from '../../src/utils/tokens.js';

export const validCustomer = {
  name: 'María López',
  email: 'maria@example.com',
  phone: '7777-8888',
  password: 'Clave1234',
};

/** Extrae "abk_rt=valor" del Set-Cookie de una respuesta (o null si no viene) */
export function getRefreshCookie(res) {
  const cookies = res.headers['set-cookie'] ?? [];
  const cookie = cookies.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
  return cookie ? cookie.split(';')[0] : null;
}

export async function registerCustomer(app, overrides = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ ...validCustomer, ...overrides });
  return { res, token: res.body.accessToken, cookie: getRefreshCookie(res) };
}

export async function createAdmin(app, { email = 'admin@example.com', password = 'Admin1234' } = {}) {
  await User.create({
    name: 'Admin',
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { token: res.body.accessToken, cookie: getRefreshCookie(res) };
}
