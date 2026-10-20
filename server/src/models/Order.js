/**
 * Pedido.
 *  - Los productos se COPIAN al momento de comprar (nombre, color, talla, precio):
 *    si después cambia o se borra el producto, el pedido no se altera.
 *  - Del pago solo se guarda: proveedor, id de transacción, marca y últimos 4 dígitos.
 *    NUNCA el número completo de la tarjeta ni el CVV.
 *
 *  - Entrega: retiro en tienda (gratis) o envío a domicilio (costo de Panel › Ajustes).
 *    total = subtotal (prendas) + delivery.fee. Los pedidos anteriores al envío no tienen
 *    `delivery` ni `subtotal`: se tratan como retiro en tienda con subtotal = total.
 *
 * Estados:
 *   pendiente_pago → (pago aprobado) pagado → listo_para_retiro → entregado   (retiro)
 *   pendiente_pago → (pago aprobado) pagado → enviado → entregado             (envío)
 *   pendiente_pago → (pago rechazado o expirado) pago_rechazado
 *   pagado / listo_para_retiro / enviado → cancelado (devuelve el stock)
 */
import mongoose from 'mongoose';

export const DELIVERY_METHODS = ['retiro', 'envio'];
export const ORDER_STATUSES = ['pendiente_pago', 'pago_rechazado', 'pagado', 'listo_para_retiro', 'enviado', 'entregado', 'cancelado'];
// Estados que ve la clienta en "Mis pedidos" (los intentos fallidos no se muestran)
export const CUSTOMER_VISIBLE_STATUSES = ['pagado', 'listo_para_retiro', 'enviado', 'entregado', 'cancelado'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: null },
    colorKey: { type: String, required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true }, // ABK-000123
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'El pedido no tiene productos'] },
    subtotal: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pendiente_pago', index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
    payment: {
      provider: { type: String, required: true },
      status: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
      transactionId: { type: String, default: null },
      brand: { type: String, default: null }, // visa | mastercard
      last4: { type: String, default: null },
      failureReason: { type: String, default: null },
    },
    delivery: {
      method: { type: String, enum: DELIVERY_METHODS, default: 'retiro' },
      fee: { type: Number, min: 0, default: 0 },
      // Solo en envíos:
      recipientName: String,
      phone: String,
      department: String,
      municipality: String,
      district: String,
      address: String,
      reference: String,
      estimatedTime: String,
    },
    pickup: { address: String, hours: String }, // solo en retiro en tienda
    // Evita pedidos duplicados si la misma compra se envía dos veces (doble clic, reintento de red)
    idempotencyKey: { type: String, required: true },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.idempotencyKey;
        return ret;
      },
    },
  },
);

orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
