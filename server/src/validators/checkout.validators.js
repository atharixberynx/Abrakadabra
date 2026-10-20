/**
 * Validación del carrito y del checkout.
 * Los precios que mande el navegador solo se usan para AVISAR si cambiaron:
 * el total siempre se calcula con los precios de la base de datos.
 */
import { z } from 'zod';
import { isValidLocation } from '../data/elSalvador.js';
import { SIZES } from '../models/Product.js';
import { detectBrand, isFutureExpiry, isValidLuhn, onlyDigits } from '../services/payments/card.js';
import { objectId } from './admin.validators.js';
import { phoneField } from './auth.validators.js';

export const MAX_QUANTITY_PER_LINE = 20;

const cartItemSchema = z.object({
  productId: objectId,
  colorKey: z.string().regex(/^[a-z0-9-]{1,40}$/),
  size: z.enum(SIZES),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
  price: z.number().min(0).optional(), // precio que la clienta vio (solo para avisar cambios)
});

export const cartValidateSchema = z.object({
  items: z.array(cartItemSchema).max(50),
});

const cardSchema = z
  .object({
    number: z
      .string({ error: 'Ingresa el número de la tarjeta' })
      .transform(onlyDigits)
      .refine(isValidLuhn, 'El número de tarjeta no es válido')
      .refine((n) => detectBrand(n) !== null, 'Solo aceptamos tarjetas Visa o Mastercard'),
    name: z.string().trim().min(3, 'Escribe el nombre como aparece en la tarjeta').max(60),
    expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/, 'Usa el formato MM/AA'),
    cvv: z.string().regex(/^\d{3,4}$/, 'El CVV tiene 3 o 4 dígitos'),
  })
  .refine(
    (card) => {
      const [month, year] = card.expiry.split('/').map((p) => Number(p.trim()));
      return isFutureExpiry(month, year);
    },
    { message: 'La tarjeta está vencida', path: ['expiry'] },
  );

const shippingText = (min, max, message) => z.string({ error: message }).trim().min(min, message).max(max, `Máximo ${max} caracteres`);

/**
 * Entrega. Retiro en tienda, o envío con la dirección completa.
 * `expectedFee` es el costo de envío que vio la clienta: si la tienda lo cambió mientras
 * pagaba, se avisa en vez de cobrar otro monto.
 */
const deliverySchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('retiro') }),
  z
    .object({
      method: z.literal('envio'),
      recipientName: shippingText(2, 80, 'Escribe el nombre de quien recibe'),
      phone: phoneField,
      department: z.string({ error: 'Elige el departamento' }).trim().min(1, 'Elige el departamento'),
      municipality: z.string({ error: 'Elige el municipio' }).trim().min(1, 'Elige el municipio'),
      district: z.string({ error: 'Elige el distrito' }).trim().min(1, 'Elige el distrito'),
      address: shippingText(10, 200, 'Escribe la dirección completa (colonia, calle o pasaje y número de casa)'),
      reference: z.string().trim().max(200, 'Máximo 200 caracteres').default(''),
      expectedFee: z.number().min(0).optional(),
    })
    .refine((d) => isValidLocation(d.department, d.municipality, d.district), {
      message: 'Elige un departamento, municipio y distrito válidos',
      path: ['district'],
    }),
]);

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Tu carrito está vacío').max(50),
  delivery: deliverySchema.default({ method: 'retiro' }),
  card: cardSchema,
  idempotencyKey: z.uuid('Identificador de compra inválido'),
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().regex(/^ABK-\d{6,}$/, 'Número de pedido inválido'),
});
