/**
 * Administración de productos: listado con filtros, alta, edición, estado,
 * eliminación y manejo de fotos (Cloudinary).
 */
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { LOW_STOCK_THRESHOLD, MAX_IMAGES, Product, SIZES } from '../models/Product.js';
import { HttpError } from '../utils/httpError.js';
import { uniqueSlug } from '../utils/slug.js';
import { escapeRegex, normalizeText } from '../utils/text.js';
import { deleteImage, uploadImage } from './imageService.js';

const NOT_FOUND = 'No encontramos este producto';

async function findProductOr404(id) {
  const product = await Product.findById(id);
  if (!product) throw new HttpError(404, NOT_FOUND);
  return product;
}

async function assertCategoryExists(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new HttpError(400, 'La categoría elegida no existe', [{ field: 'category', message: 'Elige una categoría' }]);
  }
}

/**
 * Deja los datos del formulario coherentes antes de guardar:
 *  - tallas en el orden estándar (S, M, L, XL, Única)
 *  - solo existencias de colores y tallas que el producto ofrece (sin repetidas)
 *  - fotos ligadas a un color eliminado pasan a ser fotos generales
 */
function normalize(data, currentImages = []) {
  const sizes = SIZES.filter((size) => data.sizes.includes(size));
  const colorKeys = new Set(data.colors.map((c) => c.key));
  const seen = new Set();
  const variants = data.variants.filter((v) => {
    const id = `${v.colorKey}|${v.size}`;
    if (!colorKeys.has(v.colorKey) || !sizes.includes(v.size) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  for (const image of currentImages) {
    if (image.colorKey && !colorKeys.has(image.colorKey)) image.colorKey = null;
  }
  return { ...data, sizes, variants };
}

/** Resumen de stock para la tabla del admin */
function stockSummary(product) {
  const lowStockVariants = product.variants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD);
  return { totalStock: product.totalStock, inStock: product.inStock, lowStock: lowStockVariants.length > 0 };
}

export async function listAdminProducts({ q, categoria, estado, stock, page, limit }) {
  const filter = {};
  if (q) filter.searchText = mongoose.trusted({ $regex: escapeRegex(normalizeText(q)) });
  if (categoria) filter.category = categoria;
  if (estado) filter.active = estado === 'activos';
  if (stock === 'agotado') filter.inStock = false;
  if (stock === 'bajo') {
    filter.variants = mongoose.trusted({ $elemMatch: { stock: { $gte: 1, $lte: LOW_STOCK_THRESHOLD } } });
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('name slug price compareAtPrice category images variants totalStock inStock active isNewArrival isFeatured colors updatedAt')
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      category: p.category ? { id: p.category._id.toString(), name: p.category.name } : null,
      image: [...p.images].sort((a, b) => a.order - b.order)[0]?.url ?? null,
      colors: p.colors,
      active: p.active,
      isNewArrival: p.isNewArrival,
      isFeatured: p.isFeatured,
      updatedAt: p.updatedAt,
      ...stockSummary(p),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAdminProduct(id) {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) throw new HttpError(404, NOT_FOUND);
  return product;
}

export async function createProduct(data) {
  await assertCategoryExists(data.category);
  const slug = await uniqueSlug(Product, data.name, 'producto');
  return Product.create({ ...normalize(data), slug });
}

/** El slug no cambia al editar, para no romper enlaces ya compartidos */
export async function updateProduct(id, data) {
  const product = await findProductOr404(id);
  await assertCategoryExists(data.category);
  product.set(normalize(data, product.images));
  await product.save();
  return product;
}

export async function setProductStatus(id, active) {
  const product = await findProductOr404(id);
  product.active = active;
  await product.save();
  return product;
}

export async function deleteProduct(id) {
  const product = await findProductOr404(id);
  await product.deleteOne();
  // Las fotos se borran de Cloudinary después: si falla, el producto igual queda eliminado
  await Promise.all(product.images.map((img) => deleteImage(img.publicId)));
}

/**
 * Sube fotos nuevas (se agregan al final, en el orden recibido).
 * `colorKeys[i]` es el color de la foto i (o null = foto general).
 */
export async function addProductImages(id, files, colorKeys) {
  const product = await findProductOr404(id);
  if (!files?.length) throw new HttpError(400, 'Selecciona al menos una imagen');
  if (product.images.length + files.length > MAX_IMAGES) {
    throw new HttpError(400, `Máximo ${MAX_IMAGES} fotos por producto (ya tiene ${product.images.length})`);
  }

  const validKeys = new Set(product.colors.map((c) => c.key));
  const uploaded = [];
  try {
    // Una por una para respetar el orden y no saturar el plan gratuito
    for (const file of files) uploaded.push(await uploadImage(file.buffer, 'productos'));

    let order = product.images.reduce((max, img) => Math.max(max, img.order), -1);
    uploaded.forEach((img, i) => {
      const colorKey = colorKeys[i] && validKeys.has(colorKeys[i]) ? colorKeys[i] : null;
      product.images.push({ ...img, colorKey, order: ++order });
    });
    await product.save();
    return product;
  } catch (err) {
    // Si algo falló, no dejar fotos huérfanas en Cloudinary
    await Promise.all(uploaded.map((img) => deleteImage(img.publicId)));
    throw err;
  }
}

/** Reordena y asigna colores. Debe incluir exactamente todas las fotos actuales */
export async function updateProductImages(id, images) {
  const product = await findProductOr404(id);
  const currentIds = product.images.map((img) => img._id.toString()).sort();
  const receivedIds = images.map((img) => img.id).sort();
  if (currentIds.length !== receivedIds.length || currentIds.some((imgId, i) => imgId !== receivedIds[i])) {
    throw new HttpError(409, 'Las fotos cambiaron mientras editabas. Recarga la página e intenta de nuevo.');
  }

  const validKeys = new Set(product.colors.map((c) => c.key));
  images.forEach((input, index) => {
    const image = product.images.id(input.id);
    image.order = index;
    image.colorKey = input.colorKey && validKeys.has(input.colorKey) ? input.colorKey : null;
  });
  await product.save();
  return product;
}

export async function deleteProductImage(id, imageId) {
  const product = await findProductOr404(id);
  const image = product.images.id(imageId);
  if (!image) throw new HttpError(404, 'No encontramos esta foto');
  const { publicId } = image;
  image.deleteOne();
  // Reenumera el orden para que la primera siga siendo la principal
  [...product.images].sort((a, b) => a.order - b.order).forEach((img, i) => (img.order = i));
  await product.save();
  await deleteImage(publicId);
  return product;
}
