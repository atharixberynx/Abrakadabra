/** Utilidades de texto: slugs, búsqueda sin tildes y regex seguras */

/** "Palazo de Vestir Ñ" → "palazo de vestir n" (minúsculas, sin tildes) */
export function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** "Palazo de vestir" → "palazo-de-vestir" */
export function slugify(value = '') {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Escapa caracteres especiales para usar texto del usuario dentro de una RegExp */
export function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Redondea a 2 decimales (precios). Evita errores como 0.1 + 0.2 = 0.30000000000000004 */
export function round2(value) {
  if (value === null || value === undefined) return value;
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
