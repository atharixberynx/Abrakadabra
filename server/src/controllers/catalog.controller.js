import * as catalog from '../services/catalogService.js';
import { listPublicBanners } from '../services/bannerService.js';

// "no-cache": el navegador puede guardar la respuesta, pero pregunta antes de reutilizarla
// (Express responde 304 si no cambió). Así, lo que edita el admin se ve de inmediato en la tienda.
const cachePublic = (res) => res.set('Cache-Control', 'no-cache');

export async function listCategories(_req, res) {
  cachePublic(res);
  res.json({ categories: await catalog.listCategories() });
}

export async function listProducts(req, res) {
  cachePublic(res);
  res.json(await catalog.listProducts(req.query));
}

export async function getFilters(req, res) {
  cachePublic(res);
  res.json(await catalog.getFilterOptions(req.query));
}

export async function getProduct(req, res) {
  cachePublic(res);
  res.json({ product: await catalog.getProductBySlug(req.params.slug) });
}

export async function getRelated(req, res) {
  cachePublic(res);
  res.json({ items: await catalog.getRelatedProducts(req.params.slug, req.query.limit) });
}

export async function listBanners(_req, res) {
  cachePublic(res);
  res.json({ banners: await listPublicBanners() });
}
