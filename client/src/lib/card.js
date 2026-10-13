/**
 * Validación y formato de tarjeta en el navegador (mismas reglas que el backend).
 * Los datos de la tarjeta solo viajan al pagar y el backend nunca los guarda completos.
 */

export const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

/** "4242424242424242" → "4242 4242 4242 4242" */
export function formatCardNumber(value) {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1229" → "12/29" (agrega la barra sola mientras se escribe) */
export function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function isValidLuhn(number) {
  const digits = onlyDigits(number);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** 'visa' | 'mastercard' | null */
export function detectBrand(number) {
  const digits = onlyDigits(number);
  if (/^4/.test(digits)) return 'visa';
  const first2 = Number(digits.slice(0, 2));
  const first4 = Number(digits.slice(0, 4));
  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) return 'mastercard';
  return null;
}

export const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard' };

/** Devuelve { campo: mensaje } con los errores de la tarjeta */
export function validateCard({ number, name, expiry, cvv }) {
  const errors = {};
  const digits = onlyDigits(number);
  if (!digits) errors.number = 'Escribe el número de la tarjeta';
  else if (!isValidLuhn(digits)) errors.number = 'El número de tarjeta no es válido';
  else if (!detectBrand(digits)) errors.number = 'Solo aceptamos tarjetas Visa o Mastercard';

  if (name.trim().length < 3) errors.name = 'Escribe el nombre como aparece en la tarjeta';

  const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) errors.expiry = 'Usa el formato MM/AA';
  else {
    const endOfMonth = new Date(2000 + Number(match[2]), Number(match[1]), 0, 23, 59, 59);
    if (endOfMonth < new Date()) errors.expiry = 'La tarjeta está vencida';
  }

  if (!/^\d{3,4}$/.test(cvv)) errors.cvv = 'El CVV tiene 3 o 4 dígitos';
  return errors;
}

/** Tarjetas que reconoce el modo de prueba */
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Pago aprobado' },
  { number: '4000 0000 0000 0002', result: 'Tarjeta rechazada' },
  { number: '4000 0000 0000 9995', result: 'Fondos insuficientes' },
];
