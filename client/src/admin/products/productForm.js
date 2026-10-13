/**
 * Estado del formulario de producto y conversión hacia/desde la API.
 *
 * Existencias: `stock` es un objeto { "colorKey|talla": "3" }.
 *  - Si la combinación está en el objeto, se OFRECE (aunque tenga 0 → aparece agotada).
 *  - Si no está, NO se ofrece (p. ej. "este color solo viene en S y M").
 */
import { slugify } from '../../lib/text.js';

export const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'Única'];
export const ONE_SIZE = 'Única';
export const MAX_IMAGES = 8;
export const MAX_IMAGE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Colores rápidos: un toque agrega el color con nombre y tono */
export const COLOR_PRESETS = [
  { name: 'Negro', hex: '#1F1B24' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Blanco hueso', hex: '#F2EDE4' },
  { name: 'Beige', hex: '#D8C3A5' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Café', hex: '#6F4E37' },
  { name: 'Gris', hex: '#8A8A8A' },
  { name: 'Azul marino', hex: '#1F2A44' },
  { name: 'Celeste', hex: '#A7C7E7' },
  { name: 'Verde olivo', hex: '#6B705C' },
  { name: 'Verde esmeralda', hex: '#1F6F5C' },
  { name: 'Rosa palo', hex: '#E8B4B8' },
  { name: 'Fucsia', hex: '#C2185B' },
  { name: 'Rojo', hex: '#C62828' },
  { name: 'Vino', hex: '#6D1A36' },
  { name: 'Lila', hex: '#B39CD0' },
  { name: 'Mostaza', hex: '#D4A017' },
  { name: 'Naranja', hex: '#E67E22' },
];

export const cellKey = (colorKey, size) => `${colorKey}|${size}`;

/** Clave interna del color: se crea una vez y no cambia aunque se renombre el color */
export function makeColorKey(name, existingKeys) {
  const base = slugify(name) || 'color';
  let key = base;
  for (let n = 2; existingKeys.includes(key); n++) key = `${base}-${n}`;
  return key;
}

export function emptyForm() {
  return {
    name: '',
    description: '',
    category: '',
    price: '',
    compareAtPrice: '',
    colors: [],
    sizes: [],
    stock: {},
    isNewArrival: false,
    isFeatured: false,
    active: true,
  };
}

export function toFormState(product) {
  const stock = {};
  for (const v of product.variants) stock[cellKey(v.colorKey, v.size)] = String(v.stock);
  return {
    name: product.name,
    description: product.description ?? '',
    category: product.category?.id ?? product.category ?? '',
    price: String(product.price),
    compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
    colors: product.colors.map((c) => ({ ...c })),
    sizes: [...product.sizes],
    stock,
    isNewArrival: product.isNewArrival,
    isFeatured: product.isFeatured,
    active: product.active,
  };
}

/** Fotos del servidor → estado del gestor de fotos */
export function toImageState(product) {
  return [...product.images]
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ uid: img.id, id: img.id, url: img.url, colorKey: img.colorKey ?? null }));
}

export function toPayload(form) {
  const variants = [];
  for (const color of form.colors) {
    for (const size of form.sizes) {
      const key = cellKey(color.key, size);
      if (key in form.stock) variants.push({ colorKey: color.key, size, stock: Number(form.stock[key]) || 0 });
    }
  }
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    price: Number(form.price),
    compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
    colors: form.colors.map((c) => ({ key: c.key, name: c.name.trim(), hex: c.hex })),
    sizes: SIZE_OPTIONS.filter((s) => form.sizes.includes(s)),
    variants,
    isNewArrival: form.isNewArrival,
    isFeatured: form.isFeatured,
    active: form.active,
  };
}

/** Devuelve { campo: mensaje } con los problemas encontrados (vacío si todo está bien) */
export function validateForm(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Escribe el nombre del producto';
  if (!form.category) errors.category = 'Elige una categoría';

  const price = Number(form.price);
  if (form.price === '' || !(price > 0)) errors.price = 'Escribe un precio mayor a $0';
  if (form.compareAtPrice !== '') {
    const compare = Number(form.compareAtPrice);
    if (!(compare > price)) errors.compareAtPrice = 'El precio anterior debe ser mayor que el precio actual';
  }

  const names = form.colors.map((c) => c.name.trim().toLowerCase());
  if (names.some((n) => !n)) errors.colors = 'Todos los colores necesitan un nombre';
  else if (new Set(names).size !== names.length) errors.colors = 'Hay dos colores con el mismo nombre';

  const badStock = Object.values(form.stock).some((v) => v !== '' && (!Number.isInteger(Number(v)) || Number(v) < 0));
  if (badStock) errors.stock = 'Las existencias deben ser números enteros (0 o más)';

  return errors;
}

/** Revisa un archivo antes de agregarlo (el backend vuelve a validar el tipo real) */
export function checkImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `"${file.name}": solo se aceptan JPG, PNG o WEBP`;
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `"${file.name}": pesa más de ${MAX_IMAGE_MB} MB`;
  return null;
}
