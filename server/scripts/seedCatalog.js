/**
 * Carga el CATÁLOGO DE EJEMPLO (8 categorías y 15 productos).
 *
 *   npm run seed:catalog
 *
 * ⚠️ BORRA las categorías y productos existentes (no toca cuentas ni pedidos).
 * En producción exige confirmar con:  npm run seed:catalog -- --yes
 *
 * También genera las imágenes de marcador (SVG) en client/public/placeholders/,
 * que se publican junto con la tienda. Al subir fotos reales desde el panel
 * administrativo, estas imágenes dejan de usarse.
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { slugify } from '../src/utils/text.js';
import { categories, products } from './data/catalog.js';
import { placeholderSvg, shapeForCategory } from './lib/placeholder.js';

const CLIENT_PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/public');
const PLACEHOLDER_DIR = path.join(CLIENT_PUBLIC, 'placeholders');

/** Stock de ejemplo determinista (siempre el mismo resultado) */
function sampleStock(mode, productIndex, colorIndex, sizeIndex) {
  if (mode === 'soldout') return 0;
  if (mode === 'low') return (productIndex + colorIndex + sizeIndex) % 3; // 0, 1 o 2
  const value = (productIndex * 7 + colorIndex * 5 + sizeIndex * 3) % 11;
  return value === 0 ? 0 : value + 1; // alguna combinación agotada, el resto entre 2 y 11
}

async function writePlaceholder(relativePath, svg, canWrite) {
  if (canWrite) {
    const fullPath = path.join(PLACEHOLDER_DIR, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, svg, 'utf8');
  }
  return `/placeholders/${relativePath}`;
}

async function run() {
  if (env.isProduction && !process.argv.includes('--yes')) {
    console.error('\n⚠️  Esto borra el catálogo en PRODUCCIÓN. Si estás segura: npm run seed:catalog -- --yes\n');
    process.exit(1);
  }

  // En Render no existe la carpeta del cliente: se usan los SVG ya publicados en Vercel
  const canWriteImages = existsSync(CLIENT_PUBLIC);

  await connectDB(env.MONGODB_URI);
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);

  const categoryBySlug = new Map();
  for (const [index, data] of categories.entries()) {
    const url = await writePlaceholder(
      `categorias/${data.slug}.svg`,
      placeholderSvg({ shape: shapeForCategory(data.slug), fill: '#795393' }),
      canWriteImages,
    );
    const category = await Category.create({ ...data, order: index, image: { url } });
    categoryBySlug.set(data.slug, category);
  }

  for (const [productIndex, data] of products.entries()) {
    const slug = slugify(data.name);
    const shape = shapeForCategory(data.category);
    const colors = data.colors.map(([name, hex]) => ({ key: slugify(name), name, hex }));
    const excluded = new Set(data.exclude ?? []);

    const variants = colors.flatMap((color, colorIndex) =>
      data.sizes
        .filter((size) => !excluded.has(`${color.key}:${size}`))
        .map((size, sizeIndex) => ({
          colorKey: color.key,
          size,
          stock: sampleStock(data.stock ?? 'normal', productIndex, colorIndex, sizeIndex),
        })),
    );

    // Dos fotos por color (principal y segunda vista), ligadas a ese color
    const images = [];
    for (const color of colors) {
      for (const view of [1, 2]) {
        const url = await writePlaceholder(
          `productos/${slug}-${color.key}-${view}.svg`,
          placeholderSvg({ label: color.name, shape, fill: color.hex, view }),
          canWriteImages,
        );
        images.push({ url, colorKey: color.key, order: images.length });
      }
    }

    await Product.create({
      name: data.name,
      slug,
      description: data.description,
      category: categoryBySlug.get(data.category)._id,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      colors,
      sizes: data.sizes,
      variants,
      images,
      isNewArrival: Boolean(data.isNewArrival),
      isFeatured: Boolean(data.isFeatured),
    });
  }

  console.log(
    `\n✔ Catálogo de ejemplo cargado: ${categories.length} categorías y ${products.length} productos.` +
      (canWriteImages ? '\n✔ Imágenes de ejemplo generadas en client/public/placeholders/' : '') +
      '\n  Recuerda: son DATOS DE EJEMPLO. Reemplázalos desde el panel administrativo.\n',
  );
}

try {
  await run();
} catch (err) {
  console.error('\n❌ No se pudo cargar el catálogo:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
