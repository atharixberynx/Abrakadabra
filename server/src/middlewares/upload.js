/**
 * Subida de imágenes (solo admin).
 *  - Multer guarda los archivos en memoria (no en disco: Render gratis no tiene disco persistente).
 *  - Límite: 5 MB por imagen.
 *  - Se valida el TIPO REAL del archivo leyendo sus primeros bytes (no basta con la
 *    extensión ni con el Content-Type que envía el navegador, que se pueden falsificar).
 */
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { HttpError } from '../utils/httpError.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 8, fields: 20 },
  // Primer filtro rápido por el tipo declarado; el definitivo es validateImageContent
  fileFilter(_req, file, callback) {
    if (ALLOWED_MIME.has(file.mimetype)) return callback(null, true);
    callback(new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WEBP'));
  },
});

/** Revisa la firma binaria de cada archivo subido */
async function validateImageContent(req, _res, next) {
  try {
    const files = req.files ?? (req.file ? [req.file] : []);
    for (const file of files) {
      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !ALLOWED_MIME.has(detected.mime)) {
        throw new HttpError(400, `"${file.originalname}" no es una imagen JPG, PNG o WEBP válida`);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** Varias imágenes en el campo "images" */
export const uploadImages = (maxCount) => [multerUpload.array('images', maxCount), validateImageContent];

/** Una sola imagen en el campo "image" */
export const uploadSingleImage = [multerUpload.single('image'), validateImageContent];
