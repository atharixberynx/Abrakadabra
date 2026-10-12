/**
 * Error con código HTTP. Lánzalo desde controladores o servicios y el
 * manejador central (middlewares/errorHandler.js) armará la respuesta.
 *
 *   throw new HttpError(404, 'Producto no encontrado');
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Envuelve un controlador async para que sus errores lleguen a `next()`.
 * Express 4 no captura por sí solo los rechazos de promesas.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
