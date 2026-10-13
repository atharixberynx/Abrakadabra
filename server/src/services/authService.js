/**
 * Lógica de autenticación: registro, login y manejo de sesiones con
 * refresh tokens rotativos.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { HttpError } from '../utils/httpError.js';
import {
  REFRESH_TOKEN_TTL_MS,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from '../utils/tokens.js';

const BCRYPT_COST = 12;

/**
 * Si dos peticiones usan el mismo refresh token casi al mismo tiempo (dos pestañas
 * abiertas al cargar), la segunda no se trata como robo durante este margen.
 */
const ROTATION_GRACE_MS = 10_000;

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';
const SESSION_EXPIRED = 'Tu sesión expiró. Inicia sesión de nuevo.';

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);

// Hash ficticio para que el login tarde lo mismo exista o no el correo
// (evita descubrir qué correos están registrados midiendo el tiempo de respuesta).
let dummyHashPromise;
const dummyHash = () => (dummyHashPromise ??= hashPassword('contraseña-ficticia-1'));

export async function registerUser({ name, email, phone, password }) {
  const passwordHash = await hashPassword(password);
  try {
    // El rol se fija aquí: el registro público SIEMPRE crea clientas
    return await User.create({ name, email, phone, passwordHash, role: 'customer' });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Ya existe una cuenta con ese correo');
    throw err;
  }
}

export async function authenticate(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !passwordOk) throw new HttpError(401, INVALID_CREDENTIALS);
  return user;
}

/** Crea un refresh token nuevo (en la familia indicada o en una nueva) y un token de acceso */
export async function issueSession(user, family = crypto.randomUUID()) {
  const refreshToken = generateRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    family,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

/**
 * Rota la sesión: invalida el refresh token recibido y entrega uno nuevo.
 * Si detecta reutilización de un token ya usado, revoca toda la familia.
 */
export async function rotateSession(rawToken) {
  if (!rawToken) throw new HttpError(401, SESSION_EXPIRED);

  const tokenHash = hashRefreshToken(rawToken);
  const now = new Date();

  // Reclamo atómico: solo una petición puede pasar el token de "vigente" a "revocado"
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: mongoose.trusted({ $gt: now }) },
    { revokedAt: now },
  );

  let family;
  let userId;

  if (claimed) {
    family = claimed.family;
    userId = claimed.user;
  } else {
    const existing = await RefreshToken.findOne({ tokenHash });
    if (!existing || existing.expiresAt <= now) throw new HttpError(401, SESSION_EXPIRED);

    const withinGrace = now - existing.revokedAt < ROTATION_GRACE_MS;

    if (!withinGrace || existing.familyRevokedAt) {
      // Reutilización real (o sesión ya cerrada): se corta toda la familia
      await revokeFamily(existing.family);
      throw new HttpError(401, SESSION_EXPIRED);
    }
    family = existing.family;
    userId = existing.user;
  }

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, SESSION_EXPIRED);

  return { user, ...(await issueSession(user, family)) };
}

/** Cierra definitivamente las sesiones que cumplan el filtro (por familia o por usuaria) */
async function revokeWhere(filter) {
  const now = new Date();
  await RefreshToken.updateMany({ ...filter, revokedAt: null }, { revokedAt: now });
  await RefreshToken.updateMany(filter, { familyRevokedAt: now });
}

export const revokeFamily = (family) => revokeWhere({ family });

/** Cierra la sesión del token recibido (toda su familia) */
export async function revokeSession(rawToken) {
  if (!rawToken) return;
  const token = await RefreshToken.findOne({ tokenHash: hashRefreshToken(rawToken) });
  if (token) await revokeFamily(token.family);
}

/** Cierra todas las sesiones de una persona (p. ej. al cambiar la contraseña) */
export const revokeAllSessions = (userId) => revokeWhere({ user: userId });

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'La contraseña actual no es correcta');
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllSessions(user._id);
  return user;
}
