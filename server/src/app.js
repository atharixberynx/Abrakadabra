/**
 * Configuración de la aplicación Express (sin `listen`), para poder usarla
 * tanto en server.js como en las pruebas con Supertest.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { sanitizeRequest } from './middlewares/sanitize.js';
import { apiLimiter } from './middlewares/rateLimiters.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  // Render (y Vercel) ponen proxies delante de la API. Sin esto, req.ip sería la IP
  // del proxy y el rate limit trataría a todas las clientas como una sola.
  app.set('trust proxy', env.TRUST_PROXY);

  // Parser de query "simple": ?a[b]=1 NO se convierte en objeto anidado.
  // Los filtros del catálogo son planos, así que no se pierde nada y se cierra
  // una vía de inyección (?email[$ne]=x).
  app.set('query parser', 'simple');

  app.use(helmet());

  app.use(
    cors({
      // Lista blanca desde CLIENT_URL. Nunca "*" porque se usan cookies (credentials).
      origin(origin, callback) {
        // Peticiones sin Origin: mismo dominio (rewrite de Vercel / proxy de Vite), curl, Render
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());

  app.use(
    pinoHttp({
      logger,
      // No llenar los logs con los pings de salud
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    }),
  );

  app.use(sanitizeRequest);

  app.use('/api', apiLimiter, apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
