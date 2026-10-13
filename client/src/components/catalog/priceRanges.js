/** Rangos de precio del filtro del catálogo (se guardan en la URL como ?min=&max=) */
export const PRICE_RANGES = [
  { id: 'hasta-10', label: 'Hasta $10', max: 10 },
  { id: '10-15', label: '$10 a $15', min: 10, max: 15 },
  { id: '15-20', label: '$15 a $20', min: 15, max: 20 },
  { id: 'mas-20', label: 'Más de $20', min: 20 },
];

/** Encuentra el rango que coincide con los valores de la URL (strings) */
export function findPriceRange(min, max) {
  return PRICE_RANGES.find((r) => String(r.min ?? '') === min && String(r.max ?? '') === max);
}
