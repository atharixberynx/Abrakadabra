/**
 * Crea los banners predeterminados del carrusel de inicio (el oficial de la marca y dos
 * con los patrones morados de la tienda).
 *
 *   npm run seed:banners            → solo si todavía no hay ningún banner
 *   npm run seed:banners -- --reset → borra los banners y vuelve a dejar los predeterminados
 *
 * La imagen es un archivo de la tienda (client/public/banners/banner-abrakadabra.webp,
 * generado con `npm run brand:assets` desde assets-marca/banner-morado.png), así que
 * funciona aunque Cloudinary no esté configurado. Desde el panel se pueden agregar más
 * banners o quitar este.
 */
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Banner } from '../src/models/Banner.js';
import { deleteImage } from '../src/services/imageService.js';

// Banners predeterminados: el oficial de la marca y dos con los patrones morados de la tienda
// (estos últimos llevan texto escrito encima con las fuentes de la marca).
const DEFAULT_BANNERS = [
  {
    imageDesktop: { url: '/banners/banner-abrakadabra.webp', publicId: null },
    alt: 'Be fashionable, be Abrakadabra. Descubre la magia: moda femenina casual chic y de oficina',
    link: '/catalogo',
  },
  {
    imageDesktop: { url: '/banners/patron-morado.svg', publicId: null },
    alt: 'Palazzos para cada ocasión, nuestra línea estrella',
    link: '/catalogo?categoria=palazzos',
    title: 'Palazzos para cada ocasión',
    subtitle: 'Nuestra línea estrella, en varios colores y de la S a la XL.',
    buttonText: 'Ver palazzos',
    textTheme: 'light',
  },
  {
    imageDesktop: { url: '/banners/hero-desktop.svg', publicId: null },
    alt: 'Compra en línea y retira en tienda',
    link: '/catalogo?nuevos=1',
    title: 'Compra en línea, retira en tienda',
    subtitle: 'Elige tus prendas favoritas y pásalas a traer a nuestra sucursal en San Salvador.',
    buttonText: 'Ver lo nuevo',
    textTheme: 'dark',
  },
].map((banner, order) => ({ imageMobile: { url: null, publicId: null }, active: true, order, ...banner }));

const reset = process.argv.includes('--reset');

try {
  await connectDB(env.MONGODB_URI);
  if (reset) {
    const existing = await Banner.find();
    await Banner.deleteMany({});
    await Promise.all(existing.flatMap((b) => [deleteImage(b.imageDesktop?.publicId), deleteImage(b.imageMobile?.publicId)]));
  }
  if ((await Banner.countDocuments()) > 0) {
    console.log('\nℹ Ya hay banners; no se cambió nada. (Usa --reset para dejar los predeterminados.)\n');
  } else {
    await Banner.create(DEFAULT_BANNERS);
    console.log(`\n✔ ${DEFAULT_BANNERS.length} banners predeterminados creados.\n`);
  }
} catch (err) {
  console.error('\n❌ No se pudieron crear los banners:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
