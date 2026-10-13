/**
 * Esquemas de validación de autenticación y cuenta.
 * z.object descarta los campos desconocidos: aunque alguien envíe `role: "admin"`
 * al registrarse, ese campo nunca llega al controlador.
 */
import { z } from 'zod';

export const nameField = z
  .string({ error: 'Ingresa tu nombre' })
  .trim()
  .min(2, 'Ingresa tu nombre')
  .max(80, 'El nombre es demasiado largo');

export const emailField = z
  .string({ error: 'Ingresa tu correo' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo es demasiado largo')
  .pipe(z.email('Ingresa un correo válido'));

/** Teléfono de El Salvador: 8 dígitos que empiezan con 2, 6 o 7. Se guarda como 7777-7777 */
export const phoneField = z
  .string({ error: 'Ingresa tu teléfono' })
  .transform((value) => value.replace(/\D/g, ''))
  .transform((digits) => (digits.length === 11 && digits.startsWith('503') ? digits.slice(3) : digits))
  .pipe(z.string().regex(/^[267]\d{7}$/, 'Ingresa un teléfono de 8 dígitos, por ejemplo 7777-7777'))
  .transform((digits) => `${digits.slice(0, 4)}-${digits.slice(4)}`);

/** bcrypt solo usa los primeros 72 bytes, por eso el máximo */
export const passwordField = z
  .string({ error: 'Ingresa una contraseña' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña debe tener como máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'La contraseña debe incluir al menos una letra')
  .regex(/\d/, 'La contraseña debe incluir al menos un número');

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

// En el login no se revela qué regla falló: solo se exige que vengan los campos
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(120),
  password: z.string().min(1).max(200),
  remember: z.boolean().default(false), // "Recuérdame"
});

export const updateMeSchema = z
  .object({ name: nameField, phone: phoneField })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'No hay datos para actualizar');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual').max(200),
  newPassword: passwordField,
});
