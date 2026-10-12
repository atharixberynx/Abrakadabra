/**
 * Punto único donde se montan todas las rutas de la API bajo /api.
 * Las rutas de administración (Fase 4+) se protegerán aquí con requireAuth + requireRole('admin').
 */
import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);

export default router;
