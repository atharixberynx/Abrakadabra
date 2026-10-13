/**
 * Rutas del panel administrativo (/api/admin/*).
 * Todas quedan protegidas con requireAuth + requireRole('admin') en routes/index.js,
 * así ninguna ruta nueva puede quedar abierta por olvido.
 */
import { Router } from 'express';
import { isCloudinaryConfigured } from '../../services/imageService.js';
import bannerRoutes from './banners.routes.js';
import categoryRoutes from './categories.routes.js';
import productRoutes from './products.routes.js';
import { customerAdminRoutes, dashboardRoutes, orderAdminRoutes } from './orders.routes.js';

const router = Router();

// Información básica del panel (el frontend la usa para avisar si falta configurar Cloudinary)
router.get('/', (req, res) => {
  res.json({
    message: 'Panel administrativo',
    admin: req.user.name,
    imageUploadsEnabled: isCloudinaryConfigured(),
  });
});

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/banners', bannerRoutes);
router.use('/orders', orderAdminRoutes);
router.use('/customers', customerAdminRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
