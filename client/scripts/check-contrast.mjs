/**
 * Verifica el contraste WCAG AA de las combinaciones de color que usa la tienda.
 * Lee la paleta directamente de src/index.css (bloque @theme), así nunca se desincroniza.
 *
 *   npm run check:contrast
 *
 * AA exige 4.5:1 para texto normal y 3:1 para texto grande (≥ 24 px, o ≥ 18.66 px en negrita).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const css = await readFile(fileURLToPath(new URL('../src/index.css', import.meta.url)), 'utf8');
const palette = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]),
);

// [texto, fondo, mínimo requerido, dónde se usa]
const PAIRS = [
  ['ink', 'white', 4.5, 'Texto general'],
  ['brand', 'white', 4.5, 'Enlaces, precios, botón secundario'],
  ['brand-dark', 'white', 4.5, 'Texto sobre fondo claro'],
  ['brand-soft', 'white', 4.5, 'Texto secundario'],
  ['white', 'brand', 4.5, 'Botón primario, barra de anuncio, footer'],
  ['white', 'brand-dark', 4.5, 'Botón primario en hover'],
  ['brand', 'lavender', 4.5, 'Texto morado sobre secciones lavanda'],
  ['ink', 'lavender', 4.5, 'Texto general sobre lavanda'],
  ['brand-dark', 'gold', 4.5, 'Insignia "Nuevo"'],
  ['gold', 'brand', 3, 'Estrella decorativa sobre morado (no es texto)'],
];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

let failures = 0;
console.log('\nContraste WCAG de la paleta Abrakadabra\n');
for (const [fg, bg, min, use] of PAIRS) {
  const ratio = contrast(palette[fg], palette[bg]);
  const ok = ratio >= min;
  if (!ok) failures++;
  console.log(
    `${ok ? '✔' : '✘'} ${`${fg} sobre ${bg}`.padEnd(26)} ${ratio.toFixed(2).padStart(5)}:1 (mín. ${min})  ${use}`,
  );
}

// Recordatorio de la regla de marca
const goldOnWhite = contrast(palette.gold, palette.white);
console.log(
  `\nℹ gold sobre white = ${goldOnWhite.toFixed(2)}:1 → por eso nunca se usa texto dorado sobre blanco.\n`,
);

process.exit(failures ? 1 : 0);
