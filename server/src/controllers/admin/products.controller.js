import * as products from '../../services/adminProductService.js';

export async function list(req, res) {
  res.json(await products.listAdminProducts(req.query));
}

export async function getOne(req, res) {
  res.json({ product: await products.getAdminProduct(req.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ product: await products.createProduct(req.body) });
}

export async function update(req, res) {
  res.json({ product: await products.updateProduct(req.params.id, req.body) });
}

export async function setStatus(req, res) {
  res.json({ product: await products.setProductStatus(req.params.id, req.body.active) });
}

export async function remove(req, res) {
  await products.deleteProduct(req.params.id);
  res.status(204).end();
}

export async function addImages(req, res) {
  const product = await products.addProductImages(req.params.id, req.files, req.body.colorKeys);
  res.status(201).json({ product });
}

export async function updateImages(req, res) {
  res.json({ product: await products.updateProductImages(req.params.id, req.body.images) });
}

export async function removeImage(req, res) {
  res.json({ product: await products.deleteProductImage(req.params.id, req.params.imageId) });
}
