/**
 * Refresh tokens (sesiones de 7 días).
 *
 * - Nunca se guarda el token en sí, solo su HMAC (si alguien lee la base de datos
 *   no puede usar los tokens).
 * - Rotación: cada uso marca el token como revocado y emite uno nuevo de la misma
 *   `family`. Si un token ya revocado se vuelve a usar (posible robo), se revoca
 *   toda la familia y la persona debe iniciar sesión otra vez.
 * - MongoDB borra solos los documentos vencidos (índice TTL en expiresAt).
 */
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    // Cuándo dejó de servir este token (por rotación o por cierre de sesión)
    revokedAt: { type: Date, default: null },
    // Cuándo se cerró la familia completa (logout, robo detectado, cambio de contraseña).
    // Distingue "este token ya se rotó" (tolerable unos segundos) de "esta sesión terminó".
    familyRevokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
