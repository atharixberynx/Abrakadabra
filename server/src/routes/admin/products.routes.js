/**
 * /api/admin/products — protegidas por requireAuth + requireRole('admin') en routes/index.js
 */
import { Router } from 'express';
import * as products from '../../controllers/admin/products.controller.js';
import { uploadImages } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { MAX_IMAGES } from '../../models/Product.js';
import { asyncHandler } from '../../utils/httpError.js';
import {
  adminProductListQuerySchema,
  idParamsSchema,
  imageParamsSchema,
  imageUploadBodySchema,
  imagesUpdateSchema,
  productInputSchema,
  statusSchema,
} from '../../validators/admin.validators.js';

const router = Router();
const byId = { params: idParamsSchema };

router.get('/', validate({ query: adminProductListQuerySchema }), asyncHandler(products.list));
router.post('/', validate({ body: productInputSchema }), asyncHandler(products.create));
router.get('/:id', validate(byId), asyncHandler(products.getOne));
router.put('/:id', validate({ ...byId, body: productInputSchema }), asyncHandler(products.update));
router.patch('/:id/status', validate({ ...byId, body: statusSchema }), asyncHandler(products.setStatus));
router.delete('/:id', validate(byId), asyncHandler(products.remove));

// Fotos: multipart con el campo "images" (archivos) y "colorKeys" (un color por archivo)
router.post(
  '/:id/images',
  validate(byId),
  ...uploadImages(MAX_IMAGES),
  validate({ body: imageUploadBodySchema }),
  asyncHandler(products.addImages),
);
router.put('/:id/images', validate({ ...byId, body: imagesUpdateSchema }), asyncHandler(products.updateImages));
router.delete('/:id/images/:imageId', validate({ params: imageParamsSchema }), asyncHandler(products.removeImage));

export default router;
