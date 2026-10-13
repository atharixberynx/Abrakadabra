/**
 * Consultas públicas del catálogo (solo productos y categorías activos).
 * Recordatorio: con sanitizeFilter activo, los operadores ($in, $gte…) se marcan
 * con mongoose.trusted() (ver config/db.js).
 */
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product, SIZES } from '../models/Product.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, normalizeText } from '../utils/text.js';

const SORTS = {
  // Los agotados siempre van al final
  nuevos: { inStock: -1, createdAt: -1, _id: -1 },
  'precio-asc': { inStock: -1, price: 1, _id: 1 },
  'precio-desc': { inStock: -1, price: -1, _id: -1 },
};

const CARD_FIELDS =
  'name slug price compareAtPrice category colors sizes availableSizes images isNewArrival inStock createdAt';

/**
 * Forma de un producto en tarjetas y listados: solo lo necesario para pintar la tarjeta.
 * Incluye todas las imágenes para poder cambiar de foto al tocar un color.
 */
export function toCard(product) {
  const images = [...(product.images ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ url: img.url, colorKey: img.colorKey }));
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    category: product.category?.slug
      ? { name: product.category.name, slug: product.category.slug }
      : null,
    colors: product.colors,
    sizes: product.sizes,
    availableSizes: product.availableSizes,
    images,
    isNewArrival: product.isNewArrival,
    inStock: product.inStock,
  };
}

async function findActiveCategory(slug) {
  return Category.findOne({ slug, active: true }).lean();
}

/** Arma el filtro de MongoDB a partir de los parámetros ya validados */
async function buildFilter({ categoria, talla, color, min, max, q, nuevos, destacados }) {
  const filter = { active: true };

  if (categoria) {
    const category = await findActiveCategory(categoria);
    if (!category) return null; // categoría inexistente → sin resultados
    filter.category = category._id;
  }
  if (talla?.length) filter.availableSizes = mongoose.trusted({ $in: talla });
  if (color?.length) {
    filter.availableColors = mongoose.trusted({ $in: color.map((c) => c.toLowerCase()) });
  }
  if (min !== undefined || max !== undefined) {
    filter.price = mongoose.trusted({
      ...(min !== undefined && { $gte: min }),
      ...(max !== undefined && { $lte: max }),
    });
  }
  if (q) {
    // Búsqueda sin tildes ni mayúsculas: "pantalon" encuentra "Pantalón"
    filter.searchText = mongoose.trusted({ $regex: escapeRegex(normalizeText(q)) });
  }
  if (nuevos) filter.isNewArrival = true;
  if (destacados) filter.isFeatured = true;

  return filter;
}

export async function listProducts(query) {
  const { orden, page, limit } = query;
  const filter = await buildFilter(query);
  if (!filter) return { items: [], total: 0, page, totalPages: 0 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(CARD_FIELDS)
      .sort(SORTS[orden])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { items: products.map(toCard), total, page, totalPages: Math.ceil(total / limit) };
}

/** Opciones disponibles para los filtros: tallas, colores y rango de precios con stock */
export async function getFilterOptions({ categoria }) {
  const match = { active: true, inStock: true };
  if (categoria) {
    const category = await findActiveCategory(categoria);
    if (!category) return { sizes: [], colors: [], price: null };
    match.category = category._id;
  }

  const [result] = await Product.aggregate([
    { $match: match },
    {
      $facet: {
        sizes: [{ $unwind: '$availableSizes' }, { $group: { _id: '$availableSizes' } }],
        colors: [
          { $unwind: '$colors' },
          { $match: { $expr: { $in: [{ $toLower: '$colors.name' }, '$availableColors'] } } },
          {
            $group: {
              _id: { $toLower: '$colors.name' },
              name: { $first: '$colors.name' },
              hex: { $first: '$colors.hex' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, name: 1 } },
        ],
        price: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
      },
    },
  ]);

  const sizeSet = new Set(result.sizes.map((s) => s._id));
  return {
    sizes: SIZES.filter((size) => sizeSet.has(size)),
    colors: result.colors.map(({ name, hex, count }) => ({ name, hex, count })),
    price: result.price[0] ? { min: result.price[0].min, max: result.price[0].max } : null,
  };
}

export async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug, active: true }).populate('category', 'name slug');
  if (!product || !product.category) throw new HttpError(404, 'No encontramos este producto');
  return product;
}

/** "También te puede gustar": otros productos de la misma categoría */
export async function getRelatedProducts(slug, limit) {
  const product = await Product.findOne({ slug, active: true }).select('category').lean();
  if (!product) throw new HttpError(404, 'No encontramos este producto');

  const related = await Product.find({
    active: true,
    category: product.category,
    _id: mongoose.trusted({ $ne: product._id }),
  })
    .select(CARD_FIELDS)
    .sort({ inStock: -1, isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .lean();

  return related.map(toCard);
}

/** Categorías activas en orden, con la cantidad de productos activos de cada una */
export async function listCategories() {
  const [categories, counts] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }),
    Product.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);
  const countById = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return categories.map((category) => ({
    ...category.toJSON(),
    productCount: countById.get(category._id.toString()) ?? 0,
  }));
}
