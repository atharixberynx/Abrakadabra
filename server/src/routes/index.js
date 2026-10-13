/**
 * Punto único donde se montan todas las rutas de la API bajo /api.
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin/index.js';
import { categoryRoutes, productRoutes } from './catalog.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

// Todo /api/admin exige sesión iniciada y rol admin (la seguridad real vive aquí, no en React)
router.use('/admin', requireAuth, requireRole('admin'), adminRoutes);

export default router;
