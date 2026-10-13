/** Administración de categorías */
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { HttpError } from '../utils/httpError.js';
import { uniqueSlug } from '../utils/slug.js';
import { deleteImage, uploadImage } from './imageService.js';

async function findCategoryOr404(id) {
  const category = await Category.findById(id);
  if (!category) throw new HttpError(404, 'No encontramos esta categoría');
  return category;
}

/** Todas las categorías (incluidas las inactivas) con su número de productos */
export async function listAdminCategories() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c.toJSON(), productCount: countById.get(String(c._id)) ?? 0 }));
}

export async function createCategory({ name, active }) {
  const last = await Category.findOne().sort({ order: -1 }).select('order').lean();
  const slug = await uniqueSlug(Category, name, 'categoria');
  return Category.create({ name, active, slug, order: (last?.order ?? -1) + 1 });
}

/** El slug no cambia al renombrar, para no romper enlaces ni la configuración de inicio */
export async function updateCategory(id, data) {
  const category = await findCategoryOr404(id);
  category.set(data);
  await category.save();
  return category;
}

/** Recibe todos los ids en el orden deseado */
export async function reorderCategories(ids) {
  const total = await Category.countDocuments();
  if (new Set(ids).size !== ids.length || ids.length !== total) {
    throw new HttpError(409, 'Las categorías cambiaron mientras editabas. Recarga la página.');
  }
  await Category.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { order } } })));
}

export async function deleteCategory(id) {
  const category = await findCategoryOr404(id);
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar: tiene ${productCount} ${productCount === 1 ? 'producto' : 'productos'}. Muévelos a otra categoría o desactívala.`,
    );
  }
  await category.deleteOne();
  await deleteImage(category.image?.publicId);
}

export async function setCategoryImage(id, file) {
  if (!file) throw new HttpError(400, 'Selecciona una imagen');
  const category = await findCategoryOr404(id);
  const previous = category.image?.publicId;
  const uploaded = await uploadImage(file.buffer, 'categorias');
  category.image = uploaded;
  try {
    await category.save();
  } catch (err) {
    await deleteImage(uploaded.publicId);
    throw err;
  }
  await deleteImage(previous);
  return category;
}

export async function removeCategoryImage(id) {
  const category = await findCategoryOr404(id);
  const previous = category.image?.publicId;
  category.image = { url: null, publicId: null };
  await category.save();
  await deleteImage(previous);
  return category;
}
