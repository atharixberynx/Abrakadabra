/**
 * Validación de las rutas de administración (productos y categorías).
 * Lista blanca estricta: cualquier campo que no esté aquí se descarta.
 */
import { z } from 'zod';
import { DELIVERY_METHODS } from '../models/Order.js';
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

const categoryName = z.string().trim().min(2, 'Ingresa el nombre de la categoría').max(40);

export const categoryCreateSchema = z.object({
  name: categoryName,
  active: z.boolean().default(true),
});

// Sin valores por defecto: en Zod 4, .partial() sobre un campo con .default() lo rellena,
// y renombrar una categoría oculta la volvería visible sin querer.
export const categoryUpdateSchema = z
  .object({ name: categoryName, active: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'No hay datos para actualizar');

export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(100) });

/** Enlace de un banner: ruta de la tienda ("/catalogo?nuevos=1") o enlace https. Vacío = sin enlace */
const bannerLink = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\/[^\s]+$/.test(v), {
    message: 'Usa una ruta de la tienda (p. ej. /catalogo) o un enlace que empiece con https://',
  });

// En multipart los valores llegan como texto: "true" / "false"
const formBoolean = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean());

const bannerAlt = z.string().trim().min(3, 'Describe brevemente el banner').max(120);
const bannerText = {
  title: z.string().trim().max(80, 'El título puede tener hasta 80 caracteres'),
  subtitle: z.string().trim().max(140, 'El subtítulo puede tener hasta 140 caracteres'),
  buttonText: z.string().trim().max(30, 'El botón puede tener hasta 30 caracteres'),
  textTheme: z.enum(['light', 'dark']),
};

export const bannerInputSchema = z.object({
  alt: bannerAlt,
  link: bannerLink.default('/catalogo'),
  active: formBoolean.default(true),
  title: bannerText.title.default(''),
  subtitle: bannerText.subtitle.default(''),
  buttonText: bannerText.buttonText.default(''),
  textTheme: bannerText.textTheme.default('light'),
});

// Sin valores por defecto (ver categoryUpdateSchema)
export const bannerUpdateSchema = z
  .object({ alt: bannerAlt, link: bannerLink, active: z.boolean(), ...bannerText })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'No hay datos para actualizar');

export const bannerImageParamsSchema = z.object({ id: objectId, variant: z.enum(['desktop', 'mobile']) });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa una fecha válida');

export const adminOrderListQuerySchema = z.object({
  // "pendientes" = pagados + listos para retiro + en camino (lo que falta entregar)
  estado: z.preprocess(
    blankToUndefined,
    z.enum(['pendientes', 'pagado', 'listo_para_retiro', 'enviado', 'entregado', 'cancelado', 'pago_rechazado']).optional(),
  ),
  entrega: z.preprocess(blankToUndefined, z.enum(DELIVERY_METHODS).optional()),
  desde: z.preprocess(blankToUndefined, isoDate.optional()),
  hasta: z.preprocess(blankToUndefined, isoDate.optional()),
  q: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(500).default(1)),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
});

export const orderStatusSchema = z.object({
  status: z.enum(['listo_para_retiro', 'enviado', 'entregado', 'cancelado']),
});

export const customerListQuerySchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(60).optional()),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(500).default(1)),
  limit: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
});

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'El enlace debe empezar con https://');

export const settingsSchema = z.object({
  announcements: z
    .array(z.string().trim().min(3, 'Cada mensaje necesita al menos 3 letras').max(90, 'Cada mensaje puede tener hasta 90 caracteres'))
    .min(1, 'Agrega al menos un mensaje')
    .max(6, 'Máximo 6 mensajes'),
  whatsappNumber: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{8,15}$/, 'Escribe el número con código de país, por ejemplo 50377777777')),
  address: z.object({
    line1: z.string().trim().min(3, 'Escribe la dirección').max(120),
    line2: z.string().trim().max(120).default(''),
    city: z.string().trim().min(2, 'Escribe la ciudad').max(120),
  }),
  hours: z
    .array(z.object({ days: z.string().trim().min(3, 'Escribe los días').max(40), time: z.string().trim().min(3, 'Escribe el horario').max(60) }))
    .min(1, 'Agrega al menos un horario')
    .max(4),
  mapsUrl: httpsUrl.refine((v) => v !== '', 'Pega el enlace de Google Maps'),
  instagramUrl: httpsUrl,
  facebookUrl: httpsUrl,
  // Opcionales: si no vienen, se conserva lo guardado
  shippingEnabled: z.boolean().optional(),
  shippingFee: z
    .preprocess(
      (v) => (v === '' ? undefined : v), // campo vacío: error claro en vez de convertirse en $0
      z.coerce
        .number({ error: 'Escribe el costo de envío' })
        .min(0, 'El costo no puede ser negativo')
        .max(50, 'El costo de envío puede ser de hasta $50')
        .transform((v) => Math.round(v * 100) / 100),
    )
    .optional(),
  shippingTime: z.string().trim().min(3, 'Escribe el tiempo de entrega').max(80).optional(),
});
