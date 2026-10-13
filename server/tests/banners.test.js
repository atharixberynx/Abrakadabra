import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Cloudinary simulado
vi.mock('../src/services/imageService.js', () => {
  let counter = 0;
  return {
    isCloudinaryConfigured: () => true,
    uploadImage: vi.fn(async () => {
      counter += 1;
      return { url: `https://res.cloudinary.com/demo/image/upload/banners/b-${counter}.png`, publicId: `banners/b-${counter}` };
    }),
    deleteImage: vi.fn(async () => {}),
  };
});

const { createApp } = await import('../src/app.js');
const { Banner } = await import('../src/models/Banner.js');
const imageService = await import('../src/services/imageService.js');
const { useTestDatabase } = await import('./helpers/db.js');
const { createAdmin, registerCustomer } = await import('./helpers/auth.js');

useTestDatabase();
const app = createApp();

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

let admin;
const auth = (req) => req.set('Authorization', `Bearer ${admin.token}`);

beforeEach(async () => {
  admin = await createAdmin(app);
  vi.clearAllMocks();
});

const createBanner = (fields = {}) =>
  auth(request(app).post('/api/admin/banners'))
    .attach('desktop', PNG, 'desktop.png')
    .field('alt', fields.alt ?? 'Nueva colección')
    .field('link', fields.link ?? '/catalogo?nuevos=1')
    .field('active', fields.active ?? 'true');

describe('Banners del carrusel', () => {
  it('la tienda solo recibe los banners activos y en orden', async () => {
    await Banner.create([
      { imageDesktop: { url: '/b2.webp' }, alt: 'Segundo', order: 1 },
      { imageDesktop: { url: '/b1.webp' }, alt: 'Primero', order: 0 },
      { imageDesktop: { url: '/b3.webp' }, alt: 'Oculto', order: 2, active: false },
    ]);
    const res = await request(app).get('/api/banners');
    expect(res.status).toBe(200);
    expect(res.body.banners.map((b) => b.alt)).toEqual(['Primero', 'Segundo']);
    expect(res.body.banners[0]).toMatchObject({ imageDesktop: '/b1.webp', imageMobile: null, link: '/catalogo' });
  });

  it('crea un banner con imagen de computadora y, opcional, de celular', async () => {
    const res = await createBanner().attach('mobile', PNG, 'mobile.png');
    expect(res.status).toBe(201);
    expect(res.body.banner.imageDesktop.url).toMatch(/res\.cloudinary\.com/);
    expect(res.body.banner.imageMobile.url).toMatch(/res\.cloudinary\.com/);
    expect(res.body.banner).toMatchObject({ alt: 'Nueva colección', link: '/catalogo?nuevos=1', active: true, order: 0 });
  });

  it('exige la imagen de computadora y valida el enlace', async () => {
    const noImage = await auth(request(app).post('/api/admin/banners')).field('alt', 'Sin imagen');
    expect(noImage.status).toBe(400);

    const badLink = await createBanner({ link: 'javascript:alert(1)' });
    expect(badLink.status).toBe(400);
    expect(imageService.uploadImage).not.toHaveBeenCalled();

    const external = await createBanner({ link: 'https://www.instagram.com/abrakadabraes' });
    expect(external.status).toBe(201);
  });

  it('permite máximo 6 banners', async () => {
    for (let i = 0; i < 6; i++) expect((await createBanner()).status).toBe(201);
    const res = await createBanner();
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Máximo 6/);
  });

  it('edita, oculta, reordena, reemplaza imagen y elimina (borrando de Cloudinary)', async () => {
    const a = (await createBanner({ alt: 'Banner A' })).body.banner;
    const b = (await createBanner({ alt: 'Banner B' })).body.banner;

    const hidden = await auth(request(app).patch(`/api/admin/banners/${a.id}`)).send({ active: false });
    expect(hidden.body.banner).toMatchObject({ active: false, alt: 'Banner A' });

    // Editar solo el texto no debe volver a activarlo
    const renamed = await auth(request(app).patch(`/api/admin/banners/${a.id}`)).send({ alt: 'Banner A editado' });
    expect(renamed.body.banner.active).toBe(false);

    expect((await auth(request(app).put('/api/admin/banners/reorder')).send({ ids: [b.id, a.id] })).status).toBe(204);
    const list = await auth(request(app).get('/api/admin/banners'));
    expect(list.body.banners.map((x) => x.alt)).toEqual(['Banner B', 'Banner A editado']);

    const replaced = await auth(request(app).put(`/api/admin/banners/${b.id}/image/desktop`)).attach('desktop', PNG, 'nuevo.png');
    expect(replaced.status).toBe(200);
    expect(imageService.deleteImage).toHaveBeenCalledWith(b.imageDesktop.publicId);

    expect((await auth(request(app).delete(`/api/admin/banners/${b.id}`))).status).toBe(204);
    expect(await Banner.countDocuments()).toBe(1);
  });

  it('una clienta no puede administrar banners', async () => {
    const { token } = await registerCustomer(app);
    const res = await request(app).get('/api/admin/banners').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
