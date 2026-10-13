/** Formatos de la tienda (dólares, El Salvador) */

/** 14.5 → "$14.50" */
export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

/** ¿El producto tiene un precio anterior mayor (está en oferta)? */
export function isOnSale(product) {
  return product.compareAtPrice != null && product.compareAtPrice > product.price;
}
