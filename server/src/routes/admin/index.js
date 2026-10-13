/**
 * Rutas del panel administrativo (/api/admin/*).
 * Todas quedan protegidas con requireAuth + requireRole('admin') en routes/index.js,
 * así ninguna ruta nueva puede quedar abierta por olvido.
 * Las secciones (productos, categorías, pedidos…) se agregan en las Fases 4 a 7.
 */
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Panel administrativo', admin: req.user.name });
});

export default router;
