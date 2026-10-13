/**
 * Protección de rutas.
 *
 *   router.get('/mis-datos', requireAuth, controller)
 *   router.use('/admin', requireAuth, requireRole('admin'), adminRoutes)
 *
 * requireAuth vuelve a leer la usuaria de la base de datos en cada petición:
 * si se elimina una cuenta o se le quita el rol de admin, el cambio aplica de inmediato
 * (no hay que esperar a que venza el token).
 */
import { User } from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { verifyAccessToken } from '../utils/tokens.js';

const LOGIN_REQUIRED = 'Inicia sesión para continuar';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, LOGIN_REQUIRED);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    // Vencido o manipulado: el frontend intentará renovar la sesión con el refresh token
    throw new HttpError(401, LOGIN_REQUIRED);
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, LOGIN_REQUIRED);

  req.user = user;
  next();
});

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, LOGIN_REQUIRED));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'No tienes permiso para realizar esta acción'));
    }
    next();
  };
