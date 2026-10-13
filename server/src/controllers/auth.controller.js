import * as authService from '../services/authService.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/tokens.js';

/** Guarda el refresh token en la cookie y responde con la usuaria y el token de acceso */
function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(status).json({ user, accessToken });
}

function clearSessionCookie(res) {
  // Express 4 no borra la cookie si se le pasa maxAge, por eso se quita
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

export async function register(req, res) {
  const user = await authService.registerUser(req.body);
  const session = await authService.issueSession(user);
  sendSession(res, 201, { user, ...session });
}

export async function login(req, res) {
  const user = await authService.authenticate(req.body.email, req.body.password);
  const session = await authService.issueSession(user);
  sendSession(res, 200, { user, ...session });
}

export async function refresh(req, res) {
  try {
    const session = await authService.rotateSession(req.cookies[REFRESH_COOKIE_NAME]);
    sendSession(res, 200, session);
  } catch (err) {
    clearSessionCookie(res);
    throw err;
  }
}

export async function logout(req, res) {
  await authService.revokeSession(req.cookies[REFRESH_COOKIE_NAME]);
  clearSessionCookie(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}

export { sendSession };
