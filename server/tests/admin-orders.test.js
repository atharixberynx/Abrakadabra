import crypto from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/Category.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { startOfDaySV, startOfMonthSV, sameMomentLastMonthSV } from '../src/utils/dates.js';
import { useTestDatabase } from './helpers/db.js';
import { createAdmin, registerCustomer } from './helpers/auth.js';

useTestDatabase();
const app = createApp();

let admin;
let maria;
let palazo;

const asAdmin = (req) => req.set('Authorization', `Bearer ${admin.token}`);

const SHIPPING = {
  method: 'envio',
  recipientName: 'María López',
  phone: '7123-4567',
  department: 'La Libertad',
  municipality: 'La Libertad Sur',
  district: 'Santa Tecla',
  address: 'Colonia Las Delicias, pasaje 3, casa 14',
};

async function buy(customer, quantity = 1, size = 'S', cardNumber = '4242424242424242', delivery = undefined) {
  const res = await request(app)
    .post('/api/orders/checkout')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({
      items: [{ productId: palazo.id, colorKey: 'negro', size, quantity }],
      card: { number: cardNumber, name: 'Clienta', expiry: '12/39', cvv: '123' },
      idempotencyKey: crypto.randomUUID(),
      ...(delivery && { delivery }),
    });
  return res.body.order;
}

const stockOf = async (size = 'S') => (await Product.findById(palazo._id)).variants.find((v) => v.size === size).stock;

beforeEach(async () => {
  admin = await createAdmin(app);
  maria = await registerCustomer(app, { name: 'María López' });
  const category = await Category.create({ name: 'Palazzos', slug: 'palazzos' });
  palazo = await Product.create({
    name: 'Palazo de vestir',
    slug: 'palazo-de-vestir',
    category: category._id,
    price: 14.5,
    colors: [{ key: 'negro', name: 'Negro', hex: '#000000' }],
    sizes: ['S', 'M'],
    variants: [
      { colorKey: 'negro', size: 'S', stock: 10 },
      { colorKey: 'negro', size: 'M', stock: 3 },
    ],
  });
});

const changeStatus = (order, status) => asAdmin(request(app).patch(`/api/admin/orders/${order.id}/status`)).send({ status });

describe('Acceso', () => {
  it('una clienta recibe 403 en pedidos, clientas y resumen del panel', async () => {
    const asCustomer = (req) => req.set('Authorization', `Bearer ${maria.token}`);
    for (const path of ['/api/admin/orders', '/api/admin/customers', '/api/admin/dashboard']) {
      expect((await asCustomer(request(app).get(path))).status).toBe(403);
    }
  });
});

describe('Lista de pedidos', () => {
  it('muestra los pedidos pagados (no los intentos rechazados) y filtra por estado y búsqueda', async () => {
    const paid = await buy(maria);
    await buy(maria, 1, 'S', '4000000000000002'); // rechazado
    const ana = await registerCustomer(app, { name: 'Ana Pérez', email: 'ana@example.com' });
    const anaOrder = await buy(ana);
    await changeStatus(anaOrder, 'listo_para_retiro');

    const all = await asAdmin(request(app).get('/api/admin/orders'));
    expect(all.body.total).toBe(2);

    const ready = await asAdmin(request(app).get('/api/admin/orders?estado=listo_para_retiro'));
    expect(ready.body.items.map((o) => o.orderNumber)).toEqual([anaOrder.orderNumber]);

    const pending = await asAdmin(request(app).get('/api/admin/orders?estado=pendientes'));
    expect(pending.body.total).toBe(2);

    const rejected = await asAdmin(request(app).get('/api/admin/orders?estado=pago_rechazado'));
    expect(rejected.body.total).toBe(1);

    const byName = await asAdmin(request(app).get('/api/admin/orders?q=ana'));
    expect(byName.body.items.map((o) => o.customer.name)).toEqual(['Ana Pérez']);

    const byNumber = await asAdmin(request(app).get(`/api/admin/orders?q=${paid.orderNumber}`));
    expect(byNumber.body.items[0]).toMatchObject({ orderNumber: paid.orderNumber, pieces: 1, total: 14.5, deliveryMethod: 'retiro' });
  });

  it('filtra por tipo de entrega y cuenta los envíos en camino como pendientes', async () => {
    const pickup = await buy(maria);
    const shipped = await buy(maria, 1, 'S', undefined, SHIPPING);
    await changeStatus(shipped, 'enviado');

    const envios = await asAdmin(request(app).get('/api/admin/orders?entrega=envio'));
    expect(envios.body.items.map((o) => o.orderNumber)).toEqual([shipped.orderNumber]);
    expect(envios.body.items[0]).toMatchObject({ deliveryMethod: 'envio', department: 'La Libertad', total: 18 });

    const retiros = await asAdmin(request(app).get('/api/admin/orders?entrega=retiro'));
    expect(retiros.body.items.map((o) => o.orderNumber)).toEqual([pickup.orderNumber]);

    const pending = await asAdmin(request(app).get('/api/admin/orders?estado=pendientes'));
    expect(pending.body.total).toBe(2);
    const dashboard = await asAdmin(request(app).get('/api/admin/dashboard'));
    expect(dashboard.body.pending).toEqual({ toPrepare: 1, ready: 0, shipped: 1, total: 2 });
  });

  it('filtra por rango de fechas (hora de El Salvador)', async () => {
    await buy(maria);
    const svToday = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = await asAdmin(request(app).get(`/api/admin/orders?desde=${svToday}&hasta=${svToday}`));
    expect(today.body.total).toBe(1);
    const old = await asAdmin(request(app).get('/api/admin/orders?desde=2020-01-01&hasta=2020-01-31'));
    expect(old.body.total).toBe(0);
  });

  it('el detalle incluye clienta, productos y pago con los últimos 4 dígitos', async () => {
    const order = await buy(maria);
    const res = await asAdmin(request(app).get(`/api/admin/orders/${order.id}`));
    expect(res.body.order).toMatchObject({
      customer: { name: 'María López', email: 'maria@example.com' },
      payment: { last4: '4242', brand: 'visa' },
    });
    expect(res.body.order.items[0]).toMatchObject({ name: 'Palazo de vestir', size: 'S', quantity: 1 });
  });
});

describe('Cambios de estado', () => {
  it('sigue el orden pagado → listo para retiro → entregado y guarda el historial', async () => {
    const order = await buy(maria);
    expect((await changeStatus(order, 'listo_para_retiro')).body.order.status).toBe('listo_para_retiro');
    const delivered = await changeStatus(order, 'entregado');
    expect(delivered.body.order.status).toBe('entregado');
    expect(delivered.body.order.statusHistory.map((h) => h.status)).toEqual([
      'pendiente_pago',
      'pagado',
      'listo_para_retiro',
      'entregado',
    ]);
  });

  it('no permite saltos ni cambiar pedidos entregados o cancelados', async () => {
    const order = await buy(maria);
    expect((await changeStatus(order, 'entregado')).status).toBe(409); // falta "listo para retiro"
    await changeStatus(order, 'listo_para_retiro');
    await changeStatus(order, 'entregado');
    expect((await changeStatus(order, 'cancelado')).status).toBe(409);
    expect((await asAdmin(request(app).patch(`/api/admin/orders/${order.id}/status`)).send({ status: 'pagado' })).status).toBe(400);
  });

  it('al cancelar devuelve el stock', async () => {
    const order = await buy(maria, 3);
    expect(await stockOf()).toBe(7);
    const res = await changeStatus(order, 'cancelado');
    expect(res.body.order.status).toBe('cancelado');
    expect(await stockOf()).toBe(10);
    const product = await Product.findById(palazo._id);
    expect(product.totalStock).toBe(13);
  });

  it('dos cancelaciones simultáneas devuelven el stock una sola vez', async () => {
    const order = await buy(maria, 2);
    const results = await Promise.all([changeStatus(order, 'cancelado'), changeStatus(order, 'cancelado')]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await stockOf()).toBe(10);
  });

  it('un envío sigue pagado → enviado → entregado, y no puede pasar por "listo para retiro"', async () => {
    const order = await buy(maria, 1, 'S', undefined, SHIPPING);
    expect((await changeStatus(order, 'listo_para_retiro')).status).toBe(409);
    expect((await changeStatus(order, 'entregado')).status).toBe(409); // falta "enviado"
    expect((await changeStatus(order, 'enviado')).body.order.status).toBe('enviado');
    expect((await changeStatus(order, 'entregado')).body.order.status).toBe('entregado');
  });

  it('un retiro en tienda (también los pedidos antiguos sin datos de entrega) no puede marcarse como enviado', async () => {
    const order = await buy(maria);
    expect((await changeStatus(order, 'enviado')).status).toBe(409);
    await Order.updateOne({ _id: order.id }, { $unset: { delivery: 1, subtotal: 1 } }); // como un pedido de antes
    expect((await changeStatus(order, 'enviado')).status).toBe(409);
    expect((await changeStatus(order, 'listo_para_retiro')).body.order.status).toBe('listo_para_retiro');
  });

  it('un envío cancelado en camino devuelve el stock', async () => {
    const order = await buy(maria, 2, 'S', undefined, SHIPPING);
    await changeStatus(order, 'enviado');
    expect((await changeStatus(order, 'cancelado')).body.order.status).toBe('cancelado');
    expect(await stockOf()).toBe(10);
  });

  it('la clienta ve el nuevo estado en "Mis pedidos"', async () => {
    const order = await buy(maria);
    await changeStatus(order, 'listo_para_retiro');
    const mine = await request(app).get(`/api/orders/mine/${order.orderNumber}`).set('Authorization', `Bearer ${maria.token}`);
    expect(mine.body.order.status).toBe('listo_para_retiro');
  });
});

describe('Resumen del panel', () => {
  it('cuenta pedidos de hoy, pendientes de retiro, ventas del mes y productos con poco stock', async () => {
    const a = await buy(maria, 2); // 29.00
    const b = await buy(maria, 1); // 14.50
    await buy(maria, 2, 'M'); // 29.00 → deja la talla M con 1 unidad (poco stock)
    await changeStatus(a, 'listo_para_retiro');
    await changeStatus(b, 'cancelado');

    const res = await asAdmin(request(app).get('/api/admin/dashboard'));
    expect(res.status).toBe(200);
    expect(res.body.ordersToday).toBe(2); // el cancelado no cuenta
    expect(res.body.pending).toEqual({ toPrepare: 1, ready: 1, shipped: 0, total: 2 });
    expect(res.body.monthSales.total).toBe(58);
    expect(res.body.lowStock).toHaveLength(1);
    expect(res.body.lowStock[0].variants).toEqual([{ color: 'Negro', size: 'M', stock: 1 }]);
    expect(res.body.pendingOrders.map((o) => o.status).sort()).toEqual(['listo_para_retiro', 'pagado']);
  });
});

describe('Clientas', () => {
  it('lista solo clientas con su número de pedidos y total comprado', async () => {
    await buy(maria, 2);
    await registerCustomer(app, { name: 'Sin pedidos', email: 'nueva@example.com' });

    const res = await asAdmin(request(app).get('/api/admin/customers'));
    expect(res.body.total).toBe(2); // el admin no aparece
    const row = res.body.items.find((c) => c.email === 'maria@example.com');
    expect(row).toMatchObject({ orders: 1, spent: 29 });
    expect(row.passwordHash).toBeUndefined();

    const detail = await asAdmin(request(app).get(`/api/admin/customers/${row.id}`));
    expect(detail.body.orders).toHaveLength(1);
    expect(detail.body.customer.email).toBe('maria@example.com');

    expect((await asAdmin(request(app).get('/api/admin/customers?q=nueva'))).body.items).toHaveLength(1);
  });

  it('el detalle de un admin no se muestra como clienta', async () => {
    const adminUser = await Order.db.model('User').findOne({ role: 'admin' });
    const res = await asAdmin(request(app).get(`/api/admin/customers/${adminUser.id}`));
    expect(res.status).toBe(404);
  });
});

describe('Fechas en hora de El Salvador', () => {
  it('el día empieza a las 06:00 UTC y el mes a las 06:00 UTC del día 1', () => {
    expect(startOfDaySV(new Date('2026-10-13T03:00:00Z')).toISOString()).toBe('2026-10-12T06:00:00.000Z');
    expect(startOfDaySV(new Date('2026-10-13T07:00:00Z')).toISOString()).toBe('2026-10-13T06:00:00.000Z');
    expect(startOfMonthSV(new Date('2026-10-01T05:00:00Z')).toISOString()).toBe('2026-09-01T06:00:00.000Z');
    expect(sameMomentLastMonthSV(new Date('2026-03-31T18:00:00Z')).toISOString()).toBe('2026-02-28T18:00:00.000Z');
  });
});
