/**
 * Datos de envío a domicilio: valores iniciales y validación en el navegador
 * (mismas reglas que server/src/validators/checkout.validators.js; el backend vuelve a validar).
 */
import { isValidLocation } from '../data/elSalvador.js';

export const EMPTY_SHIPPING = { recipientName: '', phone: '', department: '', municipality: '', district: '', address: '', reference: '' };

/** La última dirección usada (se guarda en la cuenta al comprar) o los datos de la clienta */
export function initialShipping(user) {
  const saved = user?.shippingAddress;
  if (saved?.department) return { ...EMPTY_SHIPPING, ...saved, reference: saved.reference ?? '' };
  return { ...EMPTY_SHIPPING, recipientName: user?.name ?? '', phone: user?.phone ?? '' };
}

/** Devuelve { campo: mensaje } con los errores de la dirección */
export function validateShipping(data) {
  const errors = {};
  if (data.recipientName.trim().length < 2) errors.recipientName = 'Escribe el nombre de quien recibe';
  let digits = data.phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('503')) digits = digits.slice(3);
  if (!/^[267]\d{7}$/.test(digits)) errors.phone = 'Escribe un teléfono de 8 dígitos, por ejemplo 7777-7777';
  if (!data.department) errors.department = 'Elige el departamento';
  else if (!isValidLocation(data.department, data.municipality, data.district)) errors.district = 'Elige el municipio y distrito';
  if (data.address.trim().length < 10) errors.address = 'Escribe la dirección completa (colonia, calle o pasaje y número de casa)';
  else if (data.address.trim().length > 200) errors.address = 'Máximo 200 caracteres';
  if (data.reference.trim().length > 200) errors.reference = 'Máximo 200 caracteres';
  return errors;
}
