/**
 * Logger central (pino).
 * `redact` oculta datos sensibles aunque alguien los registre por error:
 * contraseñas, tokens, cookies y datos de tarjeta (número y CVV).
 */
import pino from 'pino';
import { env } from './env.js';

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'card',
  'cardNumber',
  'cvv',
  'cvc',
];

export const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  ...SENSITIVE_FIELDS,
  ...SENSITIVE_FIELDS.map((field) => `*.${field}`),
  ...SENSITIVE_FIELDS.map((field) => `*.*.${field}`),
];

export const logger = pino({
  level: env.LOG_LEVEL ?? (env.isTest ? 'silent' : env.isProduction ? 'info' : 'debug'),
  redact: { paths: redactPaths, censor: '[OCULTO]' },
  // Logs legibles en desarrollo; JSON en producción (Render los muestra tal cual)
  transport:
    !env.isProduction && !env.isTest
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
