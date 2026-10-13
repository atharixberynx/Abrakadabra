import { Router } from 'express';
import * as users from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/httpError.js';
import { changePasswordSchema, updateMeSchema } from '../validators/auth.validators.js';

const router = Router();

router.use(requireAuth);

router.patch('/me', validate({ body: updateMeSchema }), asyncHandler(users.updateMe));
router.patch(
  '/me/password',
  authLimiter,
  validate({ body: changePasswordSchema }),
  asyncHandler(users.changePassword),
);

export default router;
