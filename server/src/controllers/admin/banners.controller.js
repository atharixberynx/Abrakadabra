import * as banners from '../../services/bannerService.js';

export async function list(_req, res) {
  res.json({ banners: await banners.listAdminBanners() });
}

export async function create(req, res) {
  res.status(201).json({ banner: await banners.createBanner(req.files, req.body) });
}

export async function update(req, res) {
  res.json({ banner: await banners.updateBanner(req.params.id, req.body) });
}

export async function replaceImage(req, res) {
  const file = req.files?.[req.params.variant]?.[0];
  res.json({ banner: await banners.replaceBannerImage(req.params.id, req.params.variant, file) });
}

export async function removeMobile(req, res) {
  res.json({ banner: await banners.removeMobileImage(req.params.id) });
}

export async function reorder(req, res) {
  await banners.reorderBanners(req.body.ids);
  res.status(204).end();
}

export async function remove(req, res) {
  await banners.deleteBanner(req.params.id);
  res.status(204).end();
}
