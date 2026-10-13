import * as authService from '../services/authService.js';
import { sendSession } from './auth.controller.js';

/** PATCH /api/users/me — nombre y teléfono (el correo no se cambia desde aquí) */
export async function updateMe(req, res) {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user });
}

/**
 * PATCH /api/users/me/password
 * Cierra todas las demás sesiones y abre una nueva en este dispositivo.
 */
export async function changePassword(req, res) {
  const user = await authService.changePassword(
    req.user._id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  const session = await authService.issueSession(user);
  sendSession(res, 200, { user, ...session });
}
