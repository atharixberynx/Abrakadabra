import { Router } from 'express';
import { dbState } from '../config/db.js';

const router = Router();

/**
 * GET /api/health
 * Lo usa el frontend para "despertar" el servidor de Render y saber si ya responde,
 * y Render para comprobar que el servicio está vivo.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    database: dbState(),
    // La IP con la que la API ve a quien consulta (su propia IP: no es un dato sensible).
    // Sirve para comprobar TRUST_PROXY en producción (ver README › Despliegue).
    clientIp: req.ip,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
