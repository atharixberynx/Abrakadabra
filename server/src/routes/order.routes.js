/**
 *   POST /api/cart/validate            (público) revalida precios y existencias
 *   POST /api/orders/checkout          (clienta) paga y crea el pedido (la cuenta admin no compra)
 *   GET  /api/orders/mine              (sesión)  "Mis pedidos"
 *   GET  /api/orders/mine/:orderNumber (sesión)  detalle, solo si es de quien lo pide
 */
import { Router } from 'express';
import * as orders from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { checkoutLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/httpError.js';
import { cartValidateSchema, checkoutSchema, orderNumberParamsSchema } from '../validators/checkout.validators.js';

export const cartRoutes = Router();
cartRoutes.post('/validate', validate({ body: cartValidateSchema }), asyncHandler(orders.validate));

export const orderRoutes = Router();
orderRoutes.use(requireAuth);
orderRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store'); // datos personales: nunca en caché
  next();
});
// Solo clientas: la cuenta admin no compra (no mezcla pedidos de prueba con ventas reales)
orderRoutes.post(
  '/checkout',
  requireRole('customer'),
  checkoutLimiter,
  validate({ body: checkoutSchema }),
  asyncHandler(orders.checkout),
);
orderRoutes.get('/mine', asyncHandler(orders.listMine));
orderRoutes.get('/mine/:orderNumber', validate({ params: orderNumberParamsSchema }), asyncHandler(orders.getMine));
