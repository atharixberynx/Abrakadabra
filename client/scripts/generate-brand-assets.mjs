/**
 * Genera los recursos web de la marca a partir de los logos originales de /assets-marca.
 *
 *   npm run brand:assets
 *
 * Salida en client/public/brand/:
 *  - logo-fondo-blanco.(png|webp)  → header (recortado, sin margen sobrante)
 *  - logo-fondo-morado.(png|webp)  → footer, login y panel admin
 *  - favicon-48.png, apple-touch-icon.png, icon-192.png, icon-512.png → íconos (cara + estrella)
 *  - og-image.png                  → vista previa al compartir en redes (1200×630)
 *
 * Vuelve a ejecutarlo si la marca cambia los logos.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(root, '../../assets-marca');
const OUT = path.resolve(root, '../public/brand');
const BRAND_PURPLE = { r: 0x59, g: 0x37, b: 0x8d, alpha: 1 };

await mkdir(OUT, { recursive: true });

/** Recorta el margen sobrante y exporta en PNG y WEBP */
async function exportLogo(file, width) {
  const trimmed = await sharp(path.join(SRC, file)).trim({ threshold: 20 }).toBuffer();
  const base = path.join(OUT, file.replace('.png', ''));
  const resized = sharp(trimmed).resize({ width, withoutEnlargement: true });
  await resized.clone().png({ compressionLevel: 9 }).toFile(`${base}.png`);
  await resized.clone().webp({ quality: 90 }).toFile(`${base}.webp`);
}

await exportLogo('logo-fondo-blanco.png', 480);
await exportLogo('logo-fondo-morado.png', 480);

// Ícono: estrella + cara del logo morado (628×634 px), sin el texto, centrado en un cuadrado
const icon = await sharp(path.join(SRC, 'logo-fondo-morado.png'))
  .extract({ left: 150, top: 55, width: 330, height: 285 })
  .extend({ top: 40, bottom: 40, left: 17, right: 18, background: BRAND_PURPLE })
  .toBuffer();

for (const [name, size] of [
  ['favicon-48.png', 48],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  await sharp(icon).resize(size, size).png().toFile(path.join(OUT, name));
}

// Imagen Open Graph: logo centrado sobre el morado de la marca
const ogLogo = await sharp(path.join(SRC, 'logo-fondo-morado.png'))
  .trim({ threshold: 20 })
  .resize({ height: 420 })
  .toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: BRAND_PURPLE } })
  .composite([{ input: ogLogo, gravity: 'center' }])
  .png()
  .toFile(path.join(OUT, 'og-image.png'));

console.log(`✔ Recursos de marca generados en ${path.relative(process.cwd(), OUT)}`);
