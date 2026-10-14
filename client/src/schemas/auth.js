/**
 * Validación de formularios de cuenta (mismas reglas que el backend,
 * server/src/validators/auth.validators.js). El backend vuelve a validar todo.
 */
import { z } from '../lib/zod.js';

export const PASSWORD_RULES = [
  { id: 'length', label: 'Al menos 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'letter', label: 'Al menos una letra', test: (v) => /[A-Za-z]/.test(v) },
  { id: 'number', label: 'Al menos un número', test: (v) => /\d/.test(v) },
];

const name = z.string().trim().min(2, 'Ingresa tu nombre').max(80, 'El nombre es demasiado largo');

const email = z.string().trim().min(1, 'Ingresa tu correo').pipe(z.email('Ingresa un correo válido'));

const phone = z
  .string()
  .trim()
  .refine((value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('503')) digits = digits.slice(3);
    return /^[267]\d{7}$/.test(digits);
  }, 'Ingresa un teléfono de 8 dígitos, por ejemplo 7777-7777');

const password = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña debe tener como máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/\d/, 'La contraseña debe incluir al menos un número');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresa tu contraseña'),
  remember: z.boolean(),
});

export const registerSchema = z.object({ name, email, phone, password });

export const profileSchema = z.object({ name, phone });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: password,
});
