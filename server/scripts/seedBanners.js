/**
 * Crea el banner predeterminado del carrusel de inicio (el banner oficial de la marca).
 *
 *   npm run seed:banners            → solo si todavía no hay ningún banner
 *   npm run seed:banners -- --reset → borra los banners y vuelve a dejar solo el predeterminado
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

const DEFAULT_BANNER = {
  imageDesktop: { url: '/banners/banner-abrakadabra.webp', publicId: null },
  imageMobile: { url: null, publicId: null },
  alt: 'Be fashionable, be Abrakadabra. Descubre la magia: moda femenina casual chic y de oficina',
  link: '/catalogo',
  active: true,
  order: 0,
};

const reset = process.argv.includes('--reset');

try {
  await connectDB(env.MONGODB_URI);
  if (reset) {
    const existing = await Banner.find();
    await Banner.deleteMany({});
    await Promise.all(existing.flatMap((b) => [deleteImage(b.imageDesktop?.publicId), deleteImage(b.imageMobile?.publicId)]));
  }
  if ((await Banner.countDocuments()) > 0) {
    console.log('\nℹ Ya hay banners; no se cambió nada. (Usa --reset para dejar solo el predeterminado.)\n');
  } else {
    await Banner.create(DEFAULT_BANNER);
    console.log('\n✔ Banner predeterminado creado.\n');
  }
} catch (err) {
  console.error('\n❌ No se pudo crear el banner:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
