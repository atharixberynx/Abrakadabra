/** Banners del carrusel de inicio: consulta pública y administración */
import { Banner, MAX_BANNERS } from '../models/Banner.js';
import { HttpError } from '../utils/httpError.js';
import { deleteImage, uploadImage } from './imageService.js';

async function findBannerOr404(id) {
  const banner = await Banner.findById(id);
  if (!banner) throw new HttpError(404, 'No encontramos este banner');
  return banner;
}

/** Banners activos, en orden, con solo lo que necesita la tienda */
export async function listPublicBanners() {
  const banners = await Banner.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
  return banners.map((b) => ({
    id: b._id.toString(),
    imageDesktop: b.imageDesktop.url,
    imageMobile: b.imageMobile?.url ?? null,
    alt: b.alt,
    link: b.link || null,
  }));
}

export function listAdminBanners() {
  return Banner.find().sort({ order: 1, createdAt: 1 });
}

export async function createBanner(files, data) {
  const desktopFile = files?.desktop?.[0];
  if (!desktopFile) throw new HttpError(400, 'Elige la imagen para computadora (es obligatoria)');
  if ((await Banner.countDocuments()) >= MAX_BANNERS) {
    throw new HttpError(400, `Máximo ${MAX_BANNERS} banners. Elimina uno para agregar otro.`);
  }

  const uploaded = [];
  try {
    const imageDesktop = await uploadImage(desktopFile.buffer, 'banners');
    uploaded.push(imageDesktop);
    let imageMobile = { url: null, publicId: null };
    if (files.mobile?.[0]) {
      imageMobile = await uploadImage(files.mobile[0].buffer, 'banners');
      uploaded.push(imageMobile);
    }
    const last = await Banner.findOne().sort({ order: -1 }).select('order').lean();
    return await Banner.create({ ...data, imageDesktop, imageMobile, order: (last?.order ?? -1) + 1 });
  } catch (err) {
    await Promise.all(uploaded.map((img) => deleteImage(img.publicId)));
    throw err;
  }
}

export async function updateBanner(id, data) {
  const banner = await findBannerOr404(id);
  banner.set(data);
  await banner.save();
  return banner;
}

/** Reemplaza la imagen de escritorio o de celular (y borra la anterior de Cloudinary) */
export async function replaceBannerImage(id, variant, file) {
  if (!file) throw new HttpError(400, 'Elige una imagen');
  const banner = await findBannerOr404(id);
  const field = variant === 'mobile' ? 'imageMobile' : 'imageDesktop';
  const previous = banner[field]?.publicId;
  const uploaded = await uploadImage(file.buffer, 'banners');
  banner[field] = uploaded;
  try {
    await banner.save();
  } catch (err) {
    await deleteImage(uploaded.publicId);
    throw err;
  }
  await deleteImage(previous);
  return banner;
}

/** Quita la imagen de celular: en el celular se usará la de escritorio */
export async function removeMobileImage(id) {
  const banner = await findBannerOr404(id);
  const previous = banner.imageMobile?.publicId;
  banner.imageMobile = { url: null, publicId: null };
  await banner.save();
  await deleteImage(previous);
  return banner;
}

export async function reorderBanners(ids) {
  const total = await Banner.countDocuments();
  if (new Set(ids).size !== ids.length || ids.length !== total) {
    throw new HttpError(409, 'Los banners cambiaron mientras editabas. Recarga la página.');
  }
  await Banner.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { order } } })));
}

export async function deleteBanner(id) {
  const banner = await findBannerOr404(id);
  await banner.deleteOne();
  await Promise.all([deleteImage(banner.imageDesktop?.publicId), deleteImage(banner.imageMobile?.publicId)]);
}
