import { validateCart } from '../services/cartService.js';
import * as orders from '../services/orderService.js';
import { isTestMode } from '../services/payments/index.js';

/** POST /api/cart/validate — no requiere cuenta */
export async function validate(req, res) {
  res.json({ ...(await validateCart(req.body.items)), paymentTestMode: isTestMode });
}

/** POST /api/orders/checkout — requiere sesión */
export async function checkout(req, res) {
  const order = await orders.checkout(req.user, req.body);
  res.status(201).json({ order });
}

export async function listMine(req, res) {
  res.json({ orders: await orders.listCustomerOrders(req.user._id) });
}

export async function getMine(req, res) {
  res.json({ order: await orders.getCustomerOrder(req.user._id, req.params.orderNumber) });
}
