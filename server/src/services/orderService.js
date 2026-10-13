/**
 * Checkout y pedidos.
 *
 * Flujo del pago (pensado para que NUNCA se venda más de lo que hay):
 *  1. Revalidar el carrito con los precios y existencias de la base de datos.
 *  2. En una TRANSACCIÓN: descontar el stock de cada variante con una actualización
 *     condicional (solo si stock >= cantidad) y crear el pedido como "pendiente_pago".
 *     Si alguna variante no alcanza, se deshace todo.
 *  3. Cobrar con el proveedor de pagos (simulado o Wompi).
 *  4. Aprobado → "pagado". Rechazado → se devuelve el stock y queda "pago_rechazado".
 * Así nunca se cobra por algo que ya no hay.
 */
import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { STORE_PICKUP } from '../config/store.js';
import { nextSequence } from '../models/Counter.js';
import { CUSTOMER_VISIBLE_STATUSES, Order } from '../models/Order.js';
import { Product, computeDerivedFields } from '../models/Product.js';
import { HttpError } from '../utils/httpError.js';
import { BLOCKING_ISSUES, validateCart } from './cartService.js';
import { detectBrand, last4 } from './payments/card.js';
import { paymentProvider } from './payments/index.js';

const PENDING_EXPIRY_MS = 15 * 60 * 1000;

const formatOrderNumber = (seq) => `ABK-${String(seq).padStart(6, '0')}`;

/** Recalcula tallas y colores disponibles, inStock y totalStock tras cambiar el stock */
async function refreshDerived(productIds, session) {
  const products = await Product.find({ _id: mongoose.trusted({ $in: productIds }) }).session(session);
  for (const product of products) {
    computeDerivedFields(product);
    await product.save({ session });
  }
}

/** Devuelve al inventario las unidades de un pedido (rechazo, expiración o cancelación) */
export async function restoreStock(order, session) {
  for (const item of order.items) {
    // Si el admin eliminó esa combinación mientras tanto, no hay a dónde devolverla
    await Product.updateOne(
      { _id: item.product, variants: mongoose.trusted({ $elemMatch: { colorKey: item.colorKey, size: item.size } }) },
      { $inc: { 'variants.$.stock': item.quantity } },
      { session },
    );
  }
  await refreshDerived([...new Set(order.items.map((i) => String(i.product)))], session);
}

async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function setStatus(order, status) {
  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
}

async function markRejected(order, reason) {
  await withTransaction(async (session) => {
    await restoreStock(order, session);
    setStatus(order, 'pago_rechazado');
    order.payment.status = 'rechazado';
    order.payment.failureReason = reason;
    await order.save({ session });
  });
}

export async function checkout(user, { items, card, idempotencyKey }) {
  // 0. La misma compra enviada dos veces (doble clic, reintento) no crea otro pedido
  const previous = await Order.findOne({ user: user._id, idempotencyKey });
  if (previous) {
    if (previous.status === 'pago_rechazado') throw new HttpError(402, 'El pago fue rechazado. Intenta con otra tarjeta.');
    if (previous.status === 'pendiente_pago') throw new HttpError(409, 'Tu pago se está procesando. Espera un momento.');
    return previous;
  }

  // 1. Precios y existencias reales
  const cart = await validateCart(items);
  if (cart.lines.some((l) => l.issues.some((i) => BLOCKING_ISSUES.includes(i)))) {
    throw new HttpError(409, 'Algunos productos de tu carrito cambiaron. Revísalo antes de pagar.', cart.lines);
  }

  // 2. Reservar stock y crear el pedido (todo o nada)
  const order = await withTransaction(async (session) => {
    for (const line of cart.lines) {
      const result = await Product.updateOne(
        {
          _id: line.productId,
          active: true,
          variants: mongoose.trusted({
            $elemMatch: { colorKey: line.colorKey, size: line.size, stock: { $gte: line.quantity } },
          }),
        },
        { $inc: { 'variants.$.stock': -line.quantity } },
        { session },
      );
      if (result.modifiedCount !== 1) {
        throw new HttpError(
          409,
          `Ya no hay suficientes unidades de ${line.name} (${line.colorName}, talla ${line.size}). Revisa tu carrito.`,
        );
      }
    }
    await refreshDerived([...new Set(cart.lines.map((l) => l.productId))], session);

    const seq = await nextSequence('order', session);
    const [created] = await Order.create(
      [
        {
          orderNumber: formatOrderNumber(seq),
          user: user._id,
          customer: { name: user.name, email: user.email, phone: user.phone },
          items: cart.lines.map((l) => ({
            product: l.productId,
            name: l.name,
            slug: l.slug,
            image: l.image,
            colorKey: l.colorKey,
            colorName: l.colorName,
            size: l.size,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          })),
          total: cart.total,
          statusHistory: [{ status: 'pendiente_pago' }],
          // Solo marca y últimos 4 dígitos: nunca el número completo ni el CVV
          payment: { provider: paymentProvider.name, brand: detectBrand(card.number), last4: last4(card.number) },
          pickup: { address: STORE_PICKUP.address, hours: STORE_PICKUP.hours },
          idempotencyKey,
        },
      ],
      { session },
    );
    return created;
  });

  // 3. Cobrar
  let payment;
  try {
    payment = await paymentProvider.processPayment({ amount: order.total, card, orderId: order.orderNumber });
  } catch (err) {
    await markRejected(order, 'error_proveedor');
    throw err;
  }

  // 4. Resultado
  if (!payment.approved) {
    await markRejected(order, payment.reason ?? 'rechazado');
    throw new HttpError(402, payment.message ?? 'El pago fue rechazado. Intenta con otra tarjeta.');
  }

  setStatus(order, 'pagado');
  order.payment.status = 'aprobado';
  order.payment.transactionId = payment.transactionId;
  order.paidAt = new Date();
  await order.save();
  logger.info({ orderNumber: order.orderNumber, total: order.total }, 'Pedido pagado');
  return order;
}

export function listCustomerOrders(userId) {
  return Order.find({ user: userId, status: mongoose.trusted({ $in: CUSTOMER_VISIBLE_STATUSES }) })
    .sort({ createdAt: -1 })
    .limit(100);
}

/** Detalle de un pedido, solo si pertenece a quien lo pide */
export async function getCustomerOrder(userId, orderNumber) {
  const order = await Order.findOne({
    orderNumber,
    user: userId,
    status: mongoose.trusted({ $in: CUSTOMER_VISIBLE_STATUSES }),
  });
  if (!order) throw new HttpError(404, 'No encontramos este pedido');
  return order;
}

/**
 * Libera pedidos que se quedaron en "pendiente_pago" (p. ej. si el servidor se reinició
 * justo durante un cobro): devuelve su stock y los marca como rechazados por expiración.
 */
export async function releaseStalePendingOrders() {
  const stale = await Order.find({
    status: 'pendiente_pago',
    createdAt: mongoose.trusted({ $lt: new Date(Date.now() - PENDING_EXPIRY_MS) }),
  });
  for (const order of stale) {
    try {
      await markRejected(order, 'expirado');
      logger.warn({ orderNumber: order.orderNumber }, 'Pedido pendiente expirado: stock devuelto');
    } catch (err) {
      logger.error({ err, orderNumber: order.orderNumber }, 'No se pudo liberar un pedido pendiente');
    }
  }
  return stale.length;
}
