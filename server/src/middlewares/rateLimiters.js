/**
 * Límites de peticiones por IP.
 * Requieren `app.set('trust proxy', N)` correcto (ver app.js); si no, en Render
 * todas las peticiones parecen venir de la misma IP y se bloquearía a todas las clientas.
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const MINUTE = 60 * 1000;

function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // En pruebas automatizadas no se limita (se prueba aparte cuando haga falta)
    skip: () => env.isTest,
    handler: (_req, res) => res.status(429).json({ error: { message } }),
  });
}

/** Límite general para toda la API */
export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 500,
  message: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.',
});

/** Login y registro: frena ataques de fuerza bruta */
export const authLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  message: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.',
});

/** Checkout: evita pruebas masivas de tarjetas */
export const checkoutLimiter = createLimiter({
  windowMs: 10 * MINUTE,
  limit: 10,
  message: 'Demasiados intentos de pago. Espera unos minutos e intenta de nuevo.',
});
