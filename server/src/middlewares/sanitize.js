/**
 * Protección contra inyección NoSQL y contaminación de prototipos.
 *
 * Rechaza (400) cualquier petición cuyo body o query tenga claves que:
 *  - empiecen con "$"  → operadores de MongoDB, p. ej. { "email": { "$ne": null } }
 *  - contengan "."     → acceso a campos anidados, p. ej. { "role.x": 1 }
 *  - sean __proto__, constructor o prototype
 *
 * Los params de ruta son siempre strings y se validan con Zod en cada ruta.
 * Además, mongoose usa `sanitizeFilter` (ver config/db.js) como segunda capa.
 */
import { HttpError } from '../utils/httpError.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 10;

/** Devuelve la primera clave prohibida encontrada, o null si todo está bien. */
export function findForbiddenKey(value, depth = 0) {
  if (value === null || typeof value !== 'object') return null;
  if (depth > MAX_DEPTH) return '(anidación demasiado profunda)';

  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) return key;
    const nested = findForbiddenKey(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

export function sanitizeRequest(req, _res, next) {
  const badKey = findForbiddenKey(req.body) ?? findForbiddenKey(req.query);
  if (badKey) {
    return next(new HttpError(400, 'La petición contiene campos no permitidos'));
  }
  next();
}
