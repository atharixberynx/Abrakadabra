import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { useTestDatabase } from './helpers/db.js';
import { createAdmin, registerCustomer } from './helpers/auth.js';

useTestDatabase();
const app = createApp();

const newSettings = {
  announcements: ['Envío gratis a la tienda', 'Nueva colección'],
  whatsappNumber: '+503 7123-4567',
  address: { line1: 'Calle Nueva 10', line2: 'Local 5', city: 'Santa Tecla, El Salvador' },
  hours: [
    { days: 'Lunes a sábado', time: '9:00 a. m. a 6:00 p. m.' },
  ],
  mapsUrl: 'https://maps.google.com/?q=Santa+Tecla',
  instagramUrl: 'https://www.instagram.com/abrakadabraes',
  facebookUrl: '',
};

describe('Ajustes de la tienda', () => {
  it('sin cambios guardados devuelve los valores por defecto', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.settings.address.line1).toBe('Alameda Manuel Enrique Araujo 201');
    expect(res.body.settings.announcements.length).toBeGreaterThan(0);
  });

  it('la admin los actualiza y la tienda ve los nuevos valores', async () => {
    const admin = await createAdmin(app);
    const res = await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${admin.token}`).send(newSettings);
    expect(res.status).toBe(200);
    expect(res.body.settings.whatsappNumber).toBe('50371234567');

    const store = await request(app).get('/api/settings');
    expect(store.body.settings).toMatchObject({ announcements: newSettings.announcements, address: newSettings.address, facebookUrl: '' });
  });

  it('los pedidos nuevos usan la dirección y el horario vigentes', async () => {
    const admin = await createAdmin(app);
    await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${admin.token}`).send(newSettings);

    const category = await Category.create({ name: 'Tops', slug: 'tops' });
    const product = await Product.create({
      name: 'Top', slug: 'top', category: category._id, price: 7.5,
      colors: [{ key: 'negro', name: 'Negro', hex: '#000000' }], sizes: ['Única'],
      variants: [{ colorKey: 'negro', size: 'Única', stock: 5 }],
    });
    const customer = await registerCustomer(app);
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({
        items: [{ productId: product.id, colorKey: 'negro', size: 'Única', quantity: 1 }],
        card: { number: '4242424242424242', name: 'Clienta', expiry: '12/39', cvv: '123' },
        idempotencyKey: crypto.randomUUID(),
      });
    expect(res.body.order.pickup).toEqual({
      address: 'Calle Nueva 10, Local 5, Santa Tecla, El Salvador',
      hours: 'lunes a sábado de 9:00 a. m. a 6:00 p. m.',
    });
  });

  it('valida los datos y rechaza enlaces que no son https', async () => {
    const admin = await createAdmin(app);
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ ...newSettings, whatsappNumber: '123', mapsUrl: 'javascript:alert(1)', announcements: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['whatsappNumber', 'mapsUrl', 'announcements']));
  });

  it('una clienta no puede cambiar los ajustes', async () => {
    const customer = await registerCustomer(app);
    const res = await request(app).put('/api/admin/settings').set('Authorization', `Bearer ${customer.token}`).send(newSettings);
    expect(res.status).toBe(403);
  });
});
