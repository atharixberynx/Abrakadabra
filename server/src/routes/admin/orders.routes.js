/**
 * /api/admin/orders, /api/admin/customers y /api/admin/dashboard.
 * Protegidas por requireAuth + requireRole('admin') en routes/index.js
 */
import { Router } from 'express';
import * as orders from '../../controllers/admin/orders.controller.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/httpError.js';
import {
  adminOrderListQuerySchema,
  customerListQuerySchema,
  idParamsSchema,
  orderStatusSchema,
} from '../../validators/admin.validators.js';

export const orderAdminRoutes = Router();
orderAdminRoutes.get('/', validate({ query: adminOrderListQuerySchema }), asyncHandler(orders.list));
orderAdminRoutes.get('/:id', validate({ params: idParamsSchema }), asyncHandler(orders.getOne));
orderAdminRoutes.patch(
  '/:id/status',
  validate({ params: idParamsSchema, body: orderStatusSchema }),
  asyncHandler(orders.changeStatus),
);

export const customerAdminRoutes = Router();
customerAdminRoutes.get('/', validate({ query: customerListQuerySchema }), asyncHandler(orders.listCustomers));
customerAdminRoutes.get('/:id', validate({ params: idParamsSchema }), asyncHandler(orders.getCustomer));

export const dashboardRoutes = Router();
dashboardRoutes.get('/', asyncHandler(orders.dashboard));
