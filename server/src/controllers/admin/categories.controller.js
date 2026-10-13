import * as categories from '../../services/adminCategoryService.js';

export async function list(_req, res) {
  res.json({ categories: await categories.listAdminCategories() });
}

export async function create(req, res) {
  res.status(201).json({ category: await categories.createCategory(req.body) });
}

export async function update(req, res) {
  res.json({ category: await categories.updateCategory(req.params.id, req.body) });
}

export async function reorder(req, res) {
  await categories.reorderCategories(req.body.ids);
  res.status(204).end();
}

export async function remove(req, res) {
  await categories.deleteCategory(req.params.id);
  res.status(204).end();
}

export async function setImage(req, res) {
  res.json({ category: await categories.setCategoryImage(req.params.id, req.file) });
}

export async function removeImage(req, res) {
  res.json({ category: await categories.removeCategoryImage(req.params.id) });
}
