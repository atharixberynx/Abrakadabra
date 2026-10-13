/**
 * Validación del carrito y del checkout.
 * Los precios que mande el navegador solo se usan para AVISAR si cambiaron:
 * el total siempre se calcula con los precios de la base de datos.
 */
import { z } from 'zod';
import { SIZES } from '../models/Product.js';
import { detectBrand, isFutureExpiry, isValidLuhn, onlyDigits } from '../services/payments/card.js';
import { objectId } from './admin.validators.js';

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

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Tu carrito está vacío').max(50),
  card: cardSchema,
  idempotencyKey: z.uuid('Identificador de compra inválido'),
});

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().regex(/^ABK-\d{6,}$/, 'Número de pedido inválido'),
});
