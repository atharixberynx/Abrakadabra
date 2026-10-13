import crypto from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/Category.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { releaseStalePendingOrders } from '../src/services/orderService.js';
import { useTestDatabase } from './helpers/db.js';
import { registerCustomer } from './helpers/auth.js';

useTestDatabase();
const app = createApp();

const CARDS = {
  approved: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  noFunds: '4000 0000 0000 9995',
  otherValid: '5555 5555 5555 4444', // Mastercard de prueba (Luhn válido)
};

const card = (number = CARDS.approved, overrides = {}) => ({
  number,
  name: 'María López',
  expiry: '12/39',
  cvv: '123',
  ...overrides,
});

let customer;
let palazo;
let blusa;

beforeEach(async () => {
  customer = await registerCustomer(app);
  const category = await Category.create({ name: 'Palazzos', slug: 'palazzos' });
  palazo = await Product.create({
    name: 'Palazo de vestir',
    slug: 'palazo-de-vestir',
    category: category._id,
    price: 14.5,
    colors: [{ key: 'negro', name: 'Negro', hex: '#000000' }],
    sizes: ['S', 'M'],
    variants: [
      { colorKey: 'negro', size: 'S', stock: 3 },
      { colorKey: 'negro', size: 'M', stock: 1 },
    ],
    images: [{ url: '/negro.svg', colorKey: 'negro', order: 0 }],
  });
  blusa = await Product.create({
    name: 'Blusa básica',
    slug: 'blusa-basica',
    category: category._id,
    price: 9,
    colors: [{ key: 'blanco', name: 'Blanco', hex: '#FFFFFF' }],
    sizes: ['L'],
    variants: [{ colorKey: 'blanco', size: 'L', stock: 5 }],
  });
});

const item = (product, colorKey, size, quantity, extra = {}) => ({
  productId: product.id,
  colorKey,
  size,
  quantity,
  ...extra,
});

const checkout = (body, token = customer.token) =>
  request(app)
    .post('/api/orders/checkout')
    .set('Authorization', `Bearer ${token}`)
    .send({ idempotencyKey: crypto.randomUUID(), card: card(), ...body });

const stockOf = async (product, colorKey, size) =>
  (await Product.findById(product._id)).variants.find((v) => v.colorKey === colorKey && v.size === size).stock;

describe('POST /api/cart/validate', () => {
  it('no requiere cuenta y calcula el total con los precios de la base de datos', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({ items: [item(palazo, 'negro', 'S', 2, { price: 14.5 }), item(blusa, 'blanco', 'L', 1, { price: 9 })] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.total).toBe(38);
    expect(res.body.paymentTestMode).toBe(true);
    expect(res.body.lines[0]).toMatchObject({ name: 'Palazo de vestir', colorName: 'Negro', unitPrice: 14.5, image: '/negro.svg' });
  });

  it('avisa si cambió el precio, si no alcanza el stock o si ya no está disponible', async () => {
    await Product.updateOne({ _id: blusa._id }, { active: false });
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [
          item(palazo, 'negro', 'S', 1, { price: 10 }),
          item(palazo, 'negro', 'M', 5),
          item(blusa, 'blanco', 'L', 1),
        ],
      });
    const [priceChanged, tooMany, gone] = res.body.lines;
    expect(priceChanged.issues).toEqual(['precio_cambio']);
    expect(priceChanged.previousPrice).toBe(10);
    expect(tooMany.issues).toEqual(['stock_insuficiente']);
    expect(tooMany.availableQuantity).toBe(1);
    expect(gone.issues).toEqual(['no_disponible']);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/orders/checkout', () => {
  it('exige sesión iniciada', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({ items: [item(palazo, 'negro', 'S', 1)], card: card(), idempotencyKey: crypto.randomUUID() });
    expect(res.status).toBe(401);
  });

  it('con tarjeta aprobada crea el pedido pagado, descuenta el stock y usa precios de la base de datos', async () => {
    const res = await checkout({
      // El navegador manda un precio manipulado: se ignora
      items: [item(palazo, 'negro', 'S', 2, { price: 0.01 }), item(blusa, 'blanco', 'L', 1)],
    });
    expect(res.status).toBe(201);
    const { order } = res.body;
    expect(order.orderNumber).toMatch(/^ABK-\d{6}$/);
    expect(order.status).toBe('pagado');
    expect(order.total).toBe(38);
    expect(order.payment).toMatchObject({ provider: 'simulated', status: 'aprobado', brand: 'visa', last4: '4242' });
    expect(order.payment.transactionId).toMatch(/^SIM-/);
    expect(order.pickup.address).toMatch(/Alameda Manuel Enrique Araujo 201/);
    expect(order.items[0]).toMatchObject({ name: 'Palazo de vestir', colorName: 'Negro', size: 'S', quantity: 2, unitPrice: 14.5 });

    expect(await stockOf(palazo, 'negro', 'S')).toBe(1);
    expect(await stockOf(blusa, 'blanco', 'L')).toBe(4);
  });

  it('nunca guarda el número completo de la tarjeta ni el CVV', async () => {
    await checkout({ items: [item(palazo, 'negro', 'S', 1)], card: card(CARDS.approved, { cvv: '987' }) });
    const stored = JSON.stringify(await Order.find().lean());
    expect(stored).not.toContain('4242424242424242');
    expect(stored).not.toContain('4242 4242 4242 4242');
    expect(stored).not.toContain('987');
  });

  it('recalcula tallas disponibles e inStock al agotarse una variante', async () => {
    await checkout({ items: [item(palazo, 'negro', 'M', 1)] });
    const updated = await Product.findById(palazo._id);
    expect(updated.availableSizes).toEqual(['S']);
    expect(updated.totalStock).toBe(3);
  });

  it.each([
    ['rechazada', CARDS.declined, /rechazó/],
    ['sin fondos', CARDS.noFunds, /fondos suficientes/],
  ])('tarjeta %s: no crea pedido visible ni descuenta stock', async (_caso, number, message) => {
    const res = await checkout({ items: [item(palazo, 'negro', 'S', 2)], card: card(number) });
    expect(res.status).toBe(402);
    expect(res.body.error.message).toMatch(message);
    expect(await stockOf(palazo, 'negro', 'S')).toBe(3);

    const rejected = await Order.findOne();
    expect(rejected.status).toBe('pago_rechazado');
    const mine = await request(app).get('/api/orders/mine').set('Authorization', `Bearer ${customer.token}`);
    expect(mine.body.orders).toHaveLength(0);
  });

  it('cualquier otra tarjeta válida (Luhn) se aprueba', async () => {
    const res = await checkout({ items: [item(blusa, 'blanco', 'L', 1)], card: card(CARDS.otherValid) });
    expect(res.status).toBe(201);
    expect(res.body.order.payment.brand).toBe('mastercard');
  });

  it.each([
    ['número que no pasa Luhn', { number: '4242 4242 4242 4241' }, 'card.number'],
    ['American Express', { number: '3782 822463 10005' }, 'card.number'],
    ['tarjeta vencida', { expiry: '01/20' }, 'card.expiry'],
    ['fecha mal escrita', { expiry: '13/30' }, 'card.expiry'],
    ['CVV inválido', { cvv: '12' }, 'card.cvv'],
  ])('rechaza datos de tarjeta inválidos: %s', async (_caso, overrides, field) => {
    const res = await checkout({ items: [item(palazo, 'negro', 'S', 1)], card: card(CARDS.approved, overrides) });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
    expect(JSON.stringify(res.body)).not.toContain('4242');
  });

  it('no permite comprar más de lo que hay', async () => {
    const res = await checkout({ items: [item(palazo, 'negro', 'M', 2)] });
    expect(res.status).toBe(409);
    expect(await stockOf(palazo, 'negro', 'M')).toBe(1);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('dos compras simultáneas de la última unidad: solo una se completa y el stock nunca queda negativo', async () => {
    const other = await registerCustomer(app, { email: 'otra@example.com' });
    const results = await Promise.all([
      checkout({ items: [item(palazo, 'negro', 'M', 1)] }),
      checkout({ items: [item(palazo, 'negro', 'M', 1)] }, other.token),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    expect(await stockOf(palazo, 'negro', 'M')).toBe(0);
    expect(await Order.countDocuments({ status: 'pagado' })).toBe(1);
  });

  it('si la misma compra se envía dos veces, no crea dos pedidos ni descuenta dos veces', async () => {
    const idempotencyKey = crypto.randomUUID();
    const first = await checkout({ items: [item(palazo, 'negro', 'S', 1)], idempotencyKey });
    const second = await checkout({ items: [item(palazo, 'negro', 'S', 1)], idempotencyKey });
    expect(first.status).toBe(201);
    expect(second.body.order.orderNumber).toBe(first.body.order.orderNumber);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(palazo, 'negro', 'S')).toBe(2);
  });

  it('numera los pedidos en orden: ABK-000001, ABK-000002…', async () => {
    const a = await checkout({ items: [item(blusa, 'blanco', 'L', 1)] });
    const b = await checkout({ items: [item(blusa, 'blanco', 'L', 1)] });
    const numbers = [a.body.order.orderNumber, b.body.order.orderNumber];
    expect(Number(numbers[1].slice(4))).toBe(Number(numbers[0].slice(4)) + 1);
  });
});

describe('Mis pedidos', () => {
  it('cada clienta ve solo sus pedidos, y el detalle ajeno responde 404', async () => {
    const created = await checkout({ items: [item(palazo, 'negro', 'S', 1)] });
    const orderNumber = created.body.order.orderNumber;

    const mine = await request(app).get('/api/orders/mine').set('Authorization', `Bearer ${customer.token}`);
    expect(mine.body.orders.map((o) => o.orderNumber)).toEqual([orderNumber]);

    const detail = await request(app).get(`/api/orders/mine/${orderNumber}`).set('Authorization', `Bearer ${customer.token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.order.items).toHaveLength(1);

    const intruder = await registerCustomer(app, { email: 'intrusa@example.com' });
    const stolen = await request(app).get(`/api/orders/mine/${orderNumber}`).set('Authorization', `Bearer ${intruder.token}`);
    expect(stolen.status).toBe(404);
    const intruderList = await request(app).get('/api/orders/mine').set('Authorization', `Bearer ${intruder.token}`);
    expect(intruderList.body.orders).toHaveLength(0);
  });
});

describe('Pedidos pendientes que expiran', () => {
  it('devuelve el stock de pedidos que se quedaron "pendientes de pago" más de 15 minutos', async () => {
    await Product.updateOne({ _id: palazo._id, 'variants.size': 'S' }, { $inc: { 'variants.$.stock': -2 } });
    await Order.create({
      orderNumber: 'ABK-999999',
      user: customer.res.body.user.id,
      customer: { name: 'María', email: 'maria@example.com' },
      items: [{ product: palazo._id, name: 'Palazo', slug: 'palazo', colorKey: 'negro', colorName: 'Negro', size: 'S', quantity: 2, unitPrice: 14.5, lineTotal: 29 }],
      total: 29,
      payment: { provider: 'simulated' },
      idempotencyKey: crypto.randomUUID(),
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    });

    expect(await releaseStalePendingOrders()).toBe(1);
    expect(await stockOf(palazo, 'negro', 'S')).toBe(3);
    expect((await Order.findOne({ orderNumber: 'ABK-999999' })).payment.failureReason).toBe('expirado');
  });
});
