import * as adminOrders from '../../services/adminOrderService.js';

export async function list(req, res) {
  res.json(await adminOrders.listOrders(req.query));
}

export async function getOne(req, res) {
  res.json({ order: await adminOrders.getOrder(req.params.id) });
}

export async function changeStatus(req, res) {
  res.json({ order: await adminOrders.changeOrderStatus(req.params.id, req.body.status) });
}

export async function dashboard(_req, res) {
  res.json(await adminOrders.getDashboard());
}

export async function listCustomers(req, res) {
  res.json(await adminOrders.listCustomers(req.query));
}

export async function getCustomer(req, res) {
  res.json(await adminOrders.getCustomer(req.params.id));
}
