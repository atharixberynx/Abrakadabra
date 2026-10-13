/**
 * Imágenes en Cloudinary (plan gratuito).
 *  - Las fotos se suben desde el backend: el navegador nunca ve las credenciales.
 *  - Se guardan como máximo a 2000 px para no gastar el espacio gratuito.
 *  - La tienda las pide optimizadas (f_auto,q_auto y ancho justo), ver client/src/lib/images.js.
 */
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { HttpError } from '../utils/httpError.js';

const ROOT_FOLDER = 'abrakadabra';

export function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function assertConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new HttpError(
      503,
      'La subida de fotos no está configurada. Agrega las credenciales de Cloudinary en server/.env (ver README).',
    );
  }
}

/** Traduce los errores de Cloudinary a mensajes que la administradora pueda resolver */
function cloudinaryError(error) {
  const code = error.http_code;
  if (code === 401) {
    return new HttpError(502, 'Cloudinary rechazó las credenciales. Revisa CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en server/.env.');
  }
  if (code === 403) {
    return new HttpError(
      502,
      'Cloudinary no permite subir archivos con esta API Key (le faltan permisos). Usa la API Key principal de la cuenta o dale permisos de subida (ver README).',
    );
  }
  if (code === 420) return new HttpError(502, 'Se alcanzó el límite del plan gratuito de Cloudinary. Intenta más tarde.');
  return new HttpError(502, 'No se pudo subir la imagen. Intenta de nuevo.');
}

/** Sube una imagen (Buffer) y devuelve { url, publicId } */
export function uploadImage(buffer, folder = 'productos') {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${ROOT_FOLDER}/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
      },
      (error, result) => {
        if (error) {
          logger.error({ err: { message: error.message, http: error.http_code } }, 'Error al subir imagen a Cloudinary');
          return reject(cloudinaryError(error));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Elimina una imagen de Cloudinary. Si falla, solo se registra: no debe impedir
 * borrar el producto o la foto en la tienda.
 */
export async function deleteImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    logger.warn({ err: { message: err.message }, publicId }, 'No se pudo eliminar la imagen de Cloudinary');
  }
}
