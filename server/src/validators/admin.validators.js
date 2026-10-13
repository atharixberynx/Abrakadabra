/**
 * Validación de las rutas de administración (productos y categorías).
 * Lista blanca estricta: cualquier campo que no esté aquí se descarta.
 */
import { z } from 'zod';
import { MAX_IMAGES, SIZES } from '../models/Product.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Identificador inválido');
export const idParamsSchema = z.object({ id: objectId });
export const imageParamsSchema = z.object({ id: objectId, imageId: objectId });

const blankToUndefined = (value) => (value === '' ? undefined : value);
const price = z.coerce.number({ error: 'Ingresa un precio válido' }).min(0.01, 'El precio debe ser mayor a 0').max(10_000);
const colorKey = z.string().regex(/^[a-z0-9-]{1,40}$/, 'Clave de color inválida');

const colorSchema = z.object({
  key: colorKey,
  name: z.string().trim().min(1, 'Cada color necesita un nombre').max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido'),
});

const variantSchema = z.object({
  colorKey,
  size: z.enum(SIZES),
  stock: z.coerce.number().int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo').max(9999),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresa el nombre del producto').max(100),
    description: z.string().trim().max(2000).default(''),
    category: objectId,
    price,
    compareAtPrice: z.preprocess(blankToUndefined, price.nullable().optional()).transform((v) => v ?? null),
    colors: z.array(colorSchema).max(12, 'Máximo 12 colores por producto').default([]),
    sizes: z.array(z.enum(SIZES)).max(SIZES.length).default([]),
    variants: z.array(variantSchema).max(SIZES.length * 12).default([]),
    isNewArrival: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .refine((p) => new Set(p.colors.map((c) => c.key)).size === p.colors.length, {
    message: 'Hay colores repetidos',
    path: ['colors'],
  })
  .refine((p) => new Set(p.colors.map((c) => c.name.toLowerCase())).size === p.colors.length, {
    message: 'Hay dos colores con el mismo nombre',
    path: ['colors'],
  })
  .refine((p) => p.compareAtPrice === null || p.compareAtPrice > p.price, {
    message: 'El precio anterior debe ser mayor que el precio actual',
    path: ['compareAtPrice'],
  });

export const statusSchema = z.object({ active: z.boolean() });

export const adminProductListQuerySchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
  categoria: z.preprocess(blankToUndefined, objectId.optional()),
  estado: z.preprocess(blankToUndefined, z.enum(['activos', 'inactivos']).optional()),
  stock: z.preprocess(blankToUndefined, z.enum(['agotado', 'bajo']).optional()),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(500).default(1)),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
});

/** Campos de texto que acompañan la subida de fotos (multipart): un color por archivo */
export const imageUploadBodySchema = z.object({
  colorKeys: z
    .preprocess((v) => (v === undefined ? [] : [v].flat()), z.array(z.union([colorKey, z.literal('')])).max(MAX_IMAGES))
    .transform((keys) => keys.map((k) => k || null)),
});

/** Orden y color de todas las fotos del producto (el orden del arreglo es el orden final) */
export const imagesUpdateSchema = z.object({
  images: z
    .array(z.object({ id: objectId, colorKey: colorKey.nullable() }))
    .max(MAX_IMAGES),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa el nombre de la categoría').max(40),
  active: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'No hay datos para actualizar');

export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(100) });
