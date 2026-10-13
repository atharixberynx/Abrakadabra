/**
 * Utilidades de tokens.
 *  - Token de acceso: JWT de 15 minutos. El frontend lo guarda solo en memoria.
 *  - Refresh token: valor aleatorio opaco de 7 días, en cookie httpOnly.
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = 'abk_rt';

const JWT_OPTIONS = { issuer: 'abrakadabra-api', audience: 'abrakadabra-web' };

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_ACCESS_SECRET, {
    ...JWT_OPTIONS,
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: 'HS256',
  });
}

/** Devuelve el payload o lanza un error si el token es inválido o venció */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { ...JWT_OPTIONS, algorithms: ['HS256'] });
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

/** HMAC con JWT_REFRESH_SECRET: lo que se guarda en la base de datos */
export function hashRefreshToken(token) {
  return crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}

/** Opciones de la cookie del refresh token */
export function refreshCookieOptions() {
  return {
    httpOnly: true, // JavaScript no puede leerla (protege contra XSS)
    secure: env.isProduction, // solo por HTTPS en producción
    sameSite: 'lax', // no se envía en peticiones POST desde otros sitios (CSRF)
    path: '/api/auth', // solo viaja a las rutas de autenticación
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}
