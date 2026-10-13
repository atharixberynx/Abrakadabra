/**
 * Manejador central de errores.
 * Todas las respuestas de error tienen la forma: { error: { message, details? } }
 * En producción nunca se envía el stack trace ni mensajes internos.
 */
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, 'Recurso no encontrado'));
}

/** Traduce errores conocidos a { status, message, details } */
function normalizeError(err) {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      message: 'Datos inválidos',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    };
  }
  // Errores de Multer (subida de archivos)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Cada imagen debe pesar como máximo 5 MB',
      LIMIT_FILE_COUNT: 'Máximo 8 imágenes por producto',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado o demasiadas imágenes',
    };
    return {
      status: err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      message: messages[err.code] ?? 'No se pudo procesar la subida de archivos',
    };
  }
  // Errores de express.json()
  if (err.type === 'entity.too.large') {
    return { status: 413, message: 'La petición es demasiado grande' };
  }
  if (err.type === 'entity.parse.failed') {
    return { status: 400, message: 'JSON mal formado' };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { status: 400, message: 'Identificador inválido' };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      status: 400,
      message: 'Datos inválidos',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    };
  }
  if (err.code === 11000) {
    return { status: 409, message: 'Ya existe un registro con esos datos' };
  }
  return { status: 500, message: 'Ocurrió un error inesperado. Intenta de nuevo.' };
}

// Express reconoce un manejador de errores por tener 4 parámetros
export function errorHandler(err, req, res, _next) {
  const { status, message, details } = normalizeError(err);

  if (status >= 500) {
    req.log?.error({ err }, 'Error no controlado');
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  if (!env.isProduction && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}
