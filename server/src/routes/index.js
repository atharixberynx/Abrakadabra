/**
 * Punto único donde se montan todas las rutas de la API bajo /api.
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin/index.js';
import { bannerRoutes, categoryRoutes, productRoutes } from './catalog.routes.js';
import { cartRoutes, orderRoutes } from './order.routes.js';
import * as settings from '../controllers/settings.controller.js';
import { asyncHandler } from '../utils/httpError.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/banners', bannerRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.get('/settings', asyncHandler(settings.getPublic));

// Todo /api/admin exige sesión iniciada y rol admin (la seguridad real vive aquí, no en React)
router.use('/admin', requireAuth, requireRole('admin'), adminRoutes);

export default router;
