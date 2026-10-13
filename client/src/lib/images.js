/**
 * URLs de imágenes optimizadas.
 * Si la imagen está en Cloudinary, se pide en formato y calidad automáticos (f_auto,q_auto)
 * y al ancho necesario, así carga rápido en el celular. Otras URLs (como las imágenes de
 * ejemplo en /placeholders) se devuelven tal cual.
 */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export function imageUrl(url, width) {
  if (!url) return '';
  const match = url.match(CLOUDINARY_UPLOAD);
  if (!match) return url;
  const transforms = ['f_auto', 'q_auto', width && `w_${width}`, 'c_limit'].filter(Boolean).join(',');
  return `${match[1]}${transforms}/${match[2]}`;
}

/** srcSet con varios anchos (solo para Cloudinary; en otras URLs no hace falta) */
export function imageSrcSet(url, widths = [320, 480, 640, 960, 1280]) {
  if (!url || !CLOUDINARY_UPLOAD.test(url)) return undefined;
  return widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ');
}

/**
 * Imágenes que se muestran para un color: las ligadas a ese color más las generales.
 * Si el color no tiene fotos propias, se muestran todas.
 */
export function imagesForColor(images = [], colorKey) {
  if (!colorKey) return images;
  const forColor = images.filter((img) => img.colorKey === colorKey || !img.colorKey);
  return forColor.some((img) => img.colorKey === colorKey) ? forColor : images;
}
