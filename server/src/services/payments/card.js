/**
 * Utilidades de tarjeta (sin guardar nunca el número completo ni el CVV).
 */

export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

/** Algoritmo de Luhn: detecta números de tarjeta mal escritos */
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

/** visa | mastercard | null (solo se aceptan estas dos) */
export function detectBrand(number) {
  const digits = onlyDigits(number);
  if (/^4/.test(digits)) return 'visa';
  const first2 = Number(digits.slice(0, 2));
  const first4 = Number(digits.slice(0, 4));
  if ((first2 >= 51 && first2 <= 55) || (first4 >= 2221 && first4 <= 2720)) return 'mastercard';
  return null;
}

/** ¿La fecha MM/AA es este mes o posterior? */
export function isFutureExpiry(month, year, now = new Date()) {
  const fullYear = year < 100 ? 2000 + year : year;
  if (month < 1 || month > 12) return false;
  const endOfMonth = new Date(fullYear, month, 0, 23, 59, 59);
  return endOfMonth >= now;
}

export const last4 = (number) => onlyDigits(number).slice(-4);
