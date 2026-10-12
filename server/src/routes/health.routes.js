import { Router } from 'express';
import { dbState } from '../config/db.js';

const router = Router();

/**
 * GET /api/health
 * Lo usa el frontend para "despertar" el servidor de Render y saber si ya responde,
 * y Render para comprobar que el servicio está vivo.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    database: dbState(),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
