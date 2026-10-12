import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { findForbiddenKey } from '../src/middlewares/sanitize.js';

const app = createApp();

describe('GET /api/health', () => {
  it('responde ok con el estado de la base de datos', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('database');
  });

  it('incluye cabeceras de seguridad de helmet y oculta X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('permite el origen de la lista blanca con credenciales', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('no autoriza orígenes desconocidos', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://sitio-malicioso.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Sanitización contra inyección NoSQL', () => {
  it('rechaza operadores de MongoDB en el body', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no permitidos/);
  });

  it('rechaza claves con punto en el body', async () => {
    const res = await request(app).post('/api/health').send({ 'role.admin': true });
    expect(res.status).toBe(400);
  });

  it('rechaza __proto__ en el body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"__proto__": {"role": "admin"}}');
    expect(res.status).toBe(400);
  });

  it('no convierte ?campo[$ne]= en un objeto (query parser simple)', async () => {
    const res = await request(app).get('/api/health?email[$ne]=x');
    // Con el parser simple llega { "email[$ne]": "x" }: un string plano e inofensivo
    // que la validación con Zod de cada ruta descartará.
    expect(res.status).toBe(200);
  });

  it('findForbiddenKey detecta claves prohibidas anidadas en arreglos', () => {
    expect(findForbiddenKey({ items: [{ ok: 1 }, { $where: '1' }] })).toBe('$where');
    expect(findForbiddenKey({ name: 'Palazo', tags: ['a', 'b'] })).toBeNull();
  });
});

describe('Manejo de errores', () => {
  it('devuelve 404 en JSON para rutas inexistentes', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Recurso no encontrado');
  });

  it('devuelve 400 con JSON mal formado', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"malo": ');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('JSON mal formado');
  });

  it('rechaza cuerpos mayores a 100 KB', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ data: 'x'.repeat(110 * 1024) });
    expect(res.status).toBe(413);
  });
});
