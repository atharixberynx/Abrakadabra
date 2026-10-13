/**
 * Carga y valida las variables de entorno una sola vez.
 * Si falta algo obligatorio, el servidor no arranca y dice exactamente qué falta.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI es obligatoria'),

  // Lista separada por comas de orígenes permitidos para CORS
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Número de proxies delante de la API (Render = 1). Ver README > Despliegue.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),

  // Cloudinary es opcional hasta la Fase 4 (subida de imágenes desde el panel)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(['simulated', 'wompi']).default('simulated'),

  // Solo los usa el script `npm run seed:admin` (se validan ahí)
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`\n❌ Variables de entorno inválidas (revisa server/.env):\n${problems}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  clientOrigins: raw.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
};
