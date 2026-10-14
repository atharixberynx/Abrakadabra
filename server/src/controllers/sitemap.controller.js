/**
 * GET /api/sitemap.xml — mapa del sitio para Google con las páginas públicas,
 * las categorías y los productos activos. En producción, vercel.json lo publica en /sitemap.xml.
 */
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

const STATIC_PAGES = ['/', '/catalogo', '/sobre-nosotras', '/retiro-en-tienda', '/preguntas-frecuentes', '/guia-de-tallas', '/politica-de-cambios'];

const escapeXml = (text) => text.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

export async function sitemap(_req, res) {
  const [categories, products] = await Promise.all([
    Category.find({ active: true }).select('slug updatedAt').lean(),
    Product.find({ active: true }).select('slug updatedAt').lean(),
  ]);
  const base = env.siteUrl;
  const entry = (path, updatedAt) =>
    `  <url><loc>${escapeXml(`${base}${path}`)}</loc>${updatedAt ? `<lastmod>${new Date(updatedAt).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;

  const urls = [
    ...STATIC_PAGES.map((path) => entry(path)),
    ...categories.map((c) => entry(`/catalogo?categoria=${c.slug}`, c.updatedAt)),
    ...products.map((p) => entry(`/producto/${p.slug}`, p.updatedAt)),
  ];

  res.type('application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}
