/**
 * Lee los colores de src/theme/brand.css para que los scripts y vite.config.js
 * usen siempre los mismos valores que el sitio (una sola fuente de verdad).
 *
 *   readBrandColors() → { brand: '#59378d', gold: '#edc246', … }
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const BRAND_CSS_PATH = fileURLToPath(new URL('../src/theme/brand.css', import.meta.url));

export function readBrandColors() {
  const css = readFileSync(BRAND_CSS_PATH, 'utf8');
  return Object.fromEntries(
    [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [
      name,
      hex.toLowerCase(),
    ]),
  );
}

/** '#59378d' → { r: 89, g: 55, b: 141, alpha: 1 } (formato que usa sharp) */
export function hexToRgba(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return { r, g, b, alpha: 1 };
}
