import * as catalog from '../services/catalogService.js';

// El catálogo cambia poco: el navegador puede reutilizar la respuesta 30 s
const cachePublic = (res) => res.set('Cache-Control', 'public, max-age=30');

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
