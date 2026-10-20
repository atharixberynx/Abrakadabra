/**
 * Panel: pedidos, cambios de estado, resumen y clientas.
 *
 * Cambios de estado permitidos (dependen de la entrega):
 *   Retiro en tienda: pagado → listo_para_retiro → entregado
 *   Envío:            pagado → enviado → entregado
 *   En ambos se puede cancelar antes de entregar. entregado y cancelado son finales.
 * Al cancelar se devuelve el stock (una sola vez, aunque se intente cancelar dos veces).
 */
import mongoose from 'mongoose';
import { CUSTOMER_VISIBLE_STATUSES, Order } from '../models/Order.js';
import { LOW_STOCK_THRESHOLD, Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { sameMomentLastMonthSV, startOfDaySV, startOfMonthSV, svDayRange } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, round2 } from '../utils/text.js';
import { restoreStock } from './orderService.js';

export const TRANSITIONS = {
  retiro: {
    pagado: ['listo_para_retiro', 'cancelado'],
    listo_para_retiro: ['entregado', 'cancelado'],
  },
  envio: {
    pagado: ['enviado', 'cancelado'],
    enviado: ['entregado', 'cancelado'],
  },
};

const PENDING = ['pagado', 'listo_para_retiro', 'enviado'];
const SOLD = ['pagado', 'listo_para_retiro', 'enviado', 'entregado'];

// Los pedidos anteriores al envío a domicilio no tienen `delivery`: cuentan como retiro
const methodFilter = (method) => (method === 'envio' ? 'envio' : mongoose.trusted({ $ne: 'envio' }));

/** Filtro de la lista de pedidos del panel */
function buildOrderFilter({ estado, entrega, desde, hasta, q }) {
  const filter = {};
  if (estado === 'pendientes') filter.status = mongoose.trusted({ $in: PENDING });
  else if (estado) filter.status = estado;
  else filter.status = mongoose.trusted({ $in: CUSTOMER_VISIBLE_STATUSES }); // los intentos fallidos no estorban
  if (entrega) filter['delivery.method'] = methodFilter(entrega);

  if (desde || hasta) {
    filter.createdAt = mongoose.trusted({
      ...(desde && { $gte: svDayRange(desde).start }),
      ...(hasta && { $lt: svDayRange(hasta).end }),
    });
  }
  if (q) {
    const pattern = mongoose.trusted({ $regex: escapeRegex(q.trim()), $options: 'i' });
    filter.$or = [{ orderNumber: pattern }, { 'customer.name': pattern }, { 'customer.email': pattern }];
  }
  return filter;
}

export async function listOrders({ page, limit, ...filters }) {
  const filter = buildOrderFilter(filters);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select('orderNumber customer items total status createdAt delivery.method delivery.department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return {
    items: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customer: o.customer,
      pieces: o.items.reduce((n, i) => n + i.quantity, 0),
      total: o.total,
      status: o.status,
      deliveryMethod: o.delivery?.method ?? 'retiro',
      department: o.delivery?.department ?? null,
      createdAt: o.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrder(id) {
  const order = await Order.findById(id);
  if (!order) throw new HttpError(404, 'No encontramos este pedido');
  return order;
}

export async function changeOrderStatus(id, nextStatus) {
  // Estados desde los que se permite el cambio, según el tipo de entrega
  const allowed = Object.entries(TRANSITIONS)
    .map(([method, map]) => ({ method, from: Object.keys(map).filter((from) => map[from].includes(nextStatus)) }))
    .filter(({ from }) => from.length > 0)
    .map(({ method, from }) => ({ status: mongoose.trusted({ $in: from }), 'delivery.method': methodFilter(method) }));
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      // Cambio atómico: solo si el pedido sigue en un estado desde el que se permite el cambio
      updated = await Order.findOneAndUpdate(
        { _id: id, $or: allowed },
        { $set: { status: nextStatus }, $push: { statusHistory: { status: nextStatus, at: new Date() } } },
        { session, returnDocument: 'after' },
      );
      if (!updated) {
        const current = await Order.findById(id).session(session).select('status').lean();
        if (!current) throw new HttpError(404, 'No encontramos este pedido');
        throw new HttpError(409, `No se puede pasar de "${current.status}" a "${nextStatus}". Recarga la página.`);
      }
      if (nextStatus === 'cancelado') await restoreStock(updated, session);
    });
    return updated;
  } finally {
    await session.endSession();
  }
}

async function salesTotal(from, to) {
  const [result] = await Order.aggregate([
    { $match: { status: { $in: SOLD }, paidAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  return { total: round2(result?.total ?? 0), count: result?.count ?? 0 };
}

/** Resumen del panel */
export async function getDashboard(now = new Date()) {
  const today = startOfDaySV(now);
  const monthStart = startOfMonthSV(now);
  const lastMonthStart = startOfMonthSV(now, -1);
  const lastMonthSameMoment = sameMomentLastMonthSV(now);

  const [ordersToday, toPrepare, readyForPickup, shipped, monthSales, lastMonthSales, lowStockProducts, soldOutCount, recent] =
    await Promise.all([
      Order.countDocuments({ status: mongoose.trusted({ $in: SOLD }), paidAt: mongoose.trusted({ $gte: today }) }),
      Order.countDocuments({ status: 'pagado' }),
      Order.countDocuments({ status: 'listo_para_retiro' }),
      Order.countDocuments({ status: 'enviado' }),
      salesTotal(monthStart, now),
      salesTotal(lastMonthStart, lastMonthSameMoment),
      Product.find({
        variants: mongoose.trusted({ $elemMatch: { stock: { $gte: 1, $lte: LOW_STOCK_THRESHOLD } } }),
      })
        .select('name colors variants images active')
        .sort({ name: 1 })
        .limit(20)
        .lean(),
      Product.countDocuments({ inStock: false, active: true }),
      Order.find({ status: mongoose.trusted({ $in: PENDING }) })
        .select('orderNumber customer.name total status createdAt items.quantity delivery.method')
        .sort({ createdAt: 1 }) // los más antiguos primero: hay que prepararlos antes
        .limit(8)
        .lean(),
    ]);

  return {
    ordersToday,
    pending: { toPrepare, ready: readyForPickup, shipped, total: toPrepare + readyForPickup + shipped },
    monthSales: { ...monthSales, previousPeriod: lastMonthSales.total },
    lowStock: lowStockProducts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      active: p.active,
      image: [...p.images].sort((a, b) => a.order - b.order)[0]?.url ?? null,
      variants: p.variants
        .filter((v) => v.stock >= 1 && v.stock <= LOW_STOCK_THRESHOLD)
        .map((v) => ({ color: p.colors.find((c) => c.key === v.colorKey)?.name ?? v.colorKey, size: v.size, stock: v.stock })),
    })),
    soldOutCount,
    pendingOrders: recent.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      total: o.total,
      status: o.status,
      deliveryMethod: o.delivery?.method ?? 'retiro',
      pieces: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    })),
  };
}

/** Clientas (solo lectura) con cuántos pedidos tienen y cuánto han comprado */
export async function listCustomers({ q, page, limit }) {
  const filter = { role: 'customer' };
  if (q) {
    const pattern = mongoose.trusted({ $regex: escapeRegex(q.trim()), $options: 'i' });
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $in: SOLD } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));
  return {
    items: users.map((u) => {
      const s = byUser.get(String(u._id));
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        orders: s?.orders ?? 0,
        spent: round2(s?.spent ?? 0),
        lastOrderAt: s?.lastOrderAt ?? null,
      };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomer(id) {
  const user = await User.findOne({ _id: id, role: 'customer' });
  if (!user) throw new HttpError(404, 'No encontramos a esta clienta');
  const orders = await Order.find({ user: id, status: mongoose.trusted({ $in: CUSTOMER_VISIBLE_STATUSES }) })
    .select('orderNumber total status createdAt items.quantity')
    .sort({ createdAt: -1 })
    .lean();
  return {
    customer: user,
    orders: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      pieces: o.items.reduce((n, i) => n + i.quantity, 0),
      createdAt: o.createdAt,
    })),
  };
}
