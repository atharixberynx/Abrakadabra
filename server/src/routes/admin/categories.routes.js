/**
 * /api/admin/categories — protegidas por requireAuth + requireRole('admin') en routes/index.js
 */
import { Router } from 'express';
import * as categories from '../../controllers/admin/categories.controller.js';
import { uploadSingleImage } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/httpError.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  idParamsSchema,
  reorderSchema,
} from '../../validators/admin.validators.js';

const router = Router();
const byId = { params: idParamsSchema };

router.get('/', asyncHandler(categories.list));
router.post('/', validate({ body: categoryCreateSchema }), asyncHandler(categories.create));
// Va antes de "/:id" para que "reorder" no se interprete como un id
router.put('/reorder', validate({ body: reorderSchema }), asyncHandler(categories.reorder));
router.patch('/:id', validate({ ...byId, body: categoryUpdateSchema }), asyncHandler(categories.update));
router.delete('/:id', validate(byId), asyncHandler(categories.remove));
router.put('/:id/image', validate(byId), ...uploadSingleImage, asyncHandler(categories.setImage));
router.delete('/:id/image', validate(byId), asyncHandler(categories.removeImage));

export default router;
