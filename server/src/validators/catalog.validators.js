/**
 * Validación de los parámetros públicos del catálogo.
 * Los nombres de los parámetros están en español porque se ven en la URL de la tienda:
 *   /api/products?categoria=palazzos&talla=XL&color=negro&min=5&max=20&orden=precio-asc
 */
import { z } from 'zod';
import { SIZES } from '../models/Product.js';

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Identificador inválido');

// Un parámetro vacío (?q=) se trata como si no viniera
const blankToUndefined = (value) => (value === '' ? undefined : value);

/** Acepta ?talla=S o ?talla=S&talla=M y siempre devuelve un arreglo */
const listOf = (itemSchema) =>
  z
    .union([itemSchema, z.array(itemSchema).max(10)])
    .optional()
    .transform((value) => (value === undefined ? undefined : [value].flat()));

const optionalNumber = z.preprocess(blankToUndefined, z.coerce.number().min(0).max(10_000).optional());

const flag = z
  .preprocess(blankToUndefined, z.enum(['1', 'true']).optional())
  .transform((value) => value !== undefined);

export const productListQuerySchema = z.object({
  categoria: z.preprocess(blankToUndefined, slugSchema.optional()),
  talla: listOf(z.enum(SIZES)),
  color: listOf(z.string().trim().min(1).max(40)),
  min: optionalNumber,
  max: optionalNumber,
  q: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
  orden: z.preprocess(blankToUndefined, z.enum(['nuevos', 'precio-asc', 'precio-desc']).default('nuevos')),
  nuevos: flag,
  destacados: flag,
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(500).default(1)),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(48).default(12)),
});

export const filtersQuerySchema = z.object({
  categoria: z.preprocess(blankToUndefined, slugSchema.optional()),
});

export const slugParamsSchema = z.object({ slug: slugSchema });

export const relatedQuerySchema = z.object({
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(12).default(8)),
});
