/**
 * Imágenes de marcador de posición (SVG) para los datos de ejemplo.
 * Fondo lavanda con la silueta de la prenda pintada en su color y la leyenda
 * "Foto de ejemplo" (el nombre ya aparece en la tienda, debajo de la imagen).
 * La marca debe reemplazarlas por fotos reales.
 * No se usan fotos de modelos generadas con IA.
 */

const BRAND = '#59378D';
const LAVENDER = '#F3EEF8';
const LAVENDER_ALT = '#E9DFF3';

// Siluetas simples dibujadas en un lienzo de 800 × 1000
const SHAPES = {
  palazzo:
    'M300 300 H500 L520 340 L590 900 H440 L400 470 L360 900 H210 L280 340 Z',
  top: 'M300 330 L355 300 Q400 345 445 300 L500 330 L565 430 L515 460 L500 430 V700 H300 V430 L285 460 L235 430 Z',
  blouse:
    'M300 320 L355 290 Q400 335 445 290 L500 320 L590 560 L540 580 L500 450 V720 H300 V450 L260 580 L210 560 Z',
  dress:
    'M335 290 Q400 335 465 290 L485 420 L470 470 L590 880 H210 L330 470 L315 420 Z',
  sweater:
    'M290 320 L355 290 Q400 330 445 290 L510 320 L600 640 L550 655 L500 470 V720 H300 V470 L250 655 L200 640 Z',
  shorts: 'M290 330 H510 L540 380 L575 640 H430 L400 500 L370 640 H225 L260 380 Z',
  set: 'M320 250 L365 225 Q400 260 435 225 L480 250 L530 330 L490 355 L480 330 V470 H320 V330 L310 355 L270 330 Z M320 500 H480 L495 530 L550 920 H430 L400 640 L370 920 H250 L305 530 Z',
  accessory:
    'M330 380 m-70 0 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M470 380 m-70 0 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M330 250 V310 M470 250 V310',
};

const HANGER =
  '<path d="M400 160 a28 28 0 1 1 28 28 c-14 0 -28 8 -28 24 v14 l-150 70 h300 l-150 -70" fill="none" stroke="#59378D" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>';

const STAR = (x, y, size = 1) =>
  `<path transform="translate(${x} ${y}) scale(${size})" d="M12 0C12.9 7.6 16.4 11.1 24 12 16.4 12.9 12.9 16.4 12 24 11.1 16.4 7.6 12.9 0 12 7.6 11.1 11.1 7.6 12 0Z" fill="#EDC246"/>`;

function escapeXml(text) {
  return String(text).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

/** Silueta según la categoría del producto */
export function shapeForCategory(categorySlug) {
  return (
    {
      palazzos: 'palazzo',
      conjuntos: 'set',
      tops: 'top',
      blusas: 'blouse',
      vestidos: 'dress',
      sueteres: 'sweater',
      shorts: 'shorts',
      accesorios: 'accessory',
    }[categorySlug] ?? 'top'
  );
}

/**
 * @param {object} options
 * @param {string} [options.label]   Leyenda inferior (p. ej. el nombre del color)
 * @param {string} options.shape     Clave de SHAPES
 * @param {string} options.fill      Color de la prenda (hex)
 * @param {1|2}    [options.view]    1 = principal, 2 = segunda vista (fondo alterno, prenda girada)
 */
export function placeholderSvg({ label = '', shape, fill, view = 1 }) {
  const isAccessory = shape === 'accessory';
  const garment = isAccessory
    ? `<path d="${SHAPES.accessory}" fill="none" stroke="${fill}" stroke-width="22" stroke-linecap="round"/>`
    : `<path d="${SHAPES[shape]}" fill="${fill}" stroke="${BRAND}" stroke-opacity="0.25" stroke-width="4" stroke-linejoin="round"/>`;
  const transform = view === 2 ? 'transform="translate(800 0) scale(-1 1) rotate(-4 400 600)"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="${view === 2 ? LAVENDER_ALT : LAVENDER}"/>
  ${STAR(70, 70, 1.6)}${STAR(690, 860, 1.2)}
  ${isAccessory ? '' : HANGER}
  <g ${transform}>${garment}</g>
  ${label ? `<text x="400" y="965" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="26" fill="${BRAND}" opacity="0.85">${escapeXml(label)} · Foto de ejemplo</text>` : ''}
</svg>
`;
}
