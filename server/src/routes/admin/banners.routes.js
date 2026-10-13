/**
 * /api/admin/banners — carrusel de la página de inicio.
 * Protegidas por requireAuth + requireRole('admin') en routes/index.js
 */
import { Router } from 'express';
import * as banners from '../../controllers/admin/banners.controller.js';
import { uploadBannerImages } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/httpError.js';
import {
  bannerImageParamsSchema,
  bannerInputSchema,
  bannerUpdateSchema,
  idParamsSchema,
  reorderSchema,
} from '../../validators/admin.validators.js';

const router = Router();
const byId = { params: idParamsSchema };

router.get('/', asyncHandler(banners.list));
// multipart: archivos "desktop" (obligatorio) y "mobile" (opcional) + alt, link, active
router.post('/', ...uploadBannerImages, validate({ body: bannerInputSchema }), asyncHandler(banners.create));
router.put('/reorder', validate({ body: reorderSchema }), asyncHandler(banners.reorder));
router.patch('/:id', validate({ ...byId, body: bannerUpdateSchema }), asyncHandler(banners.update));
router.put(
  '/:id/image/:variant',
  validate({ params: bannerImageParamsSchema }),
  ...uploadBannerImages,
  asyncHandler(banners.replaceImage),
);
router.delete('/:id/image/mobile', validate(byId), asyncHandler(banners.removeMobile));
router.delete('/:id', validate(byId), asyncHandler(banners.remove));

export default router;
