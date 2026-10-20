/** Formatos de la tienda (dólares, El Salvador) */

/** 14.5 → "$14.50" */
export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

/** ¿El producto tiene un precio anterior mayor (está en oferta)? */
export function isOnSale(product) {
  return product.compareAtPrice != null && product.compareAtPrice > product.price;
}

/** Teléfono local mientras se escribe: "77771234" → "7777-1234" */
export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

/** "50369347087" → "+503 6934-7087" (otros países: "+" y los dígitos en grupos de 3) */
export function formatWhatsapp(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('503') && digits.length <= 11) {
    const local = digits.slice(3);
    return `+503 ${local.slice(0, 4)}${local.length > 4 ? `-${local.slice(4)}` : ''}`.trim();
  }
  return digits ? `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ')}` : '';
}
