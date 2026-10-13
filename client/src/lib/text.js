/** "Palazo de Vestir Ñ" → "palazo-de-vestir-n" (mismas reglas que el backend) */
export function slugify(value = '') {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
