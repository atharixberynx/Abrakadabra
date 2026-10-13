/**
 * Catálogo público: categorías y productos activos.
 *   GET /api/categories
 *   GET /api/products            (filtros, orden y paginación)
 *   GET /api/products/filters    (opciones disponibles para los filtros)
 *   GET /api/products/:slug
 *   GET /api/products/:slug/related
 *   GET /api/banners             (carrusel de la página de inicio)
 */
import { Router } from 'express';
import * as catalog from '../controllers/catalog.controller.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/httpError.js';
import {
  filtersQuerySchema,
  productListQuerySchema,
  relatedQuerySchema,
  slugParamsSchema,
} from '../validators/catalog.validators.js';

export const categoryRoutes = Router();
categoryRoutes.get('/', asyncHandler(catalog.listCategories));

export const bannerRoutes = Router();
bannerRoutes.get('/', asyncHandler(catalog.listBanners));

export const productRoutes = Router();
productRoutes.get('/', validate({ query: productListQuerySchema }), asyncHandler(catalog.listProducts));
productRoutes.get('/filters', validate({ query: filtersQuerySchema }), asyncHandler(catalog.getFilters));
productRoutes.get('/:slug', validate({ params: slugParamsSchema }), asyncHandler(catalog.getProduct));
productRoutes.get(
  '/:slug/related',
  validate({ params: slugParamsSchema, query: relatedQuerySchema }),
  asyncHandler(catalog.getRelated),
);
