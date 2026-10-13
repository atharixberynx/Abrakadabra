import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Cloudinary simulado: las pruebas nunca suben archivos de verdad
vi.mock('../src/services/imageService.js', () => {
  let counter = 0;
  return {
    isCloudinaryConfigured: () => true,
    uploadImage: vi.fn(async (_buffer, folder) => {
      counter += 1;
      return { url: `https://res.cloudinary.com/demo/image/upload/${folder}/foto-${counter}.png`, publicId: `${folder}/foto-${counter}` };
    }),
    deleteImage: vi.fn(async () => {}),
  };
});

const { createApp } = await import('../src/app.js');
const { Category } = await import('../src/models/Category.js');
const { Product } = await import('../src/models/Product.js');
const imageService = await import('../src/services/imageService.js');
const { useTestDatabase } = await import('./helpers/db.js');
const { createAdmin, registerCustomer } = await import('./helpers/auth.js');

useTestDatabase();
const app = createApp();

// PNG real de 1×1 px y un "falso JPG" (texto con extensión .jpg)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const FAKE_JPG = Buffer.from('esto no es una imagen, es texto');

let admin;
let palazzos;
let blusas;

const productBody = (overrides = {}) => ({
  name: 'Palazo de prueba',
  description: 'Descripción',
  category: palazzos.id,
  price: 14.5,
  compareAtPrice: null,
  colors: [
    { key: 'negro', name: 'Negro', hex: '#000000' },
    { key: 'vino', name: 'Vino', hex: '#6D1A36' },
  ],
  sizes: ['S', 'M'],
  variants: [
    { colorKey: 'negro', size: 'S', stock: 3 },
    { colorKey: 'negro', size: 'M', stock: 2 },
    { colorKey: 'vino', size: 'M', stock: 0 },
  ],
  isNewArrival: true,
  isFeatured: false,
  active: true,
  ...overrides,
});

const auth = (req) => req.set('Authorization', `Bearer ${admin.token}`);

beforeEach(async () => {
  admin = await createAdmin(app);
  palazzos = (await Category.create({ name: 'Palazzos', slug: 'palazzos', order: 0 })).toJSON();
  blusas = (await Category.create({ name: 'Blusas', slug: 'blusas', order: 1 })).toJSON();
  vi.clearAllMocks();
});

async function createProduct(overrides) {
  const res = await auth(request(app).post('/api/admin/products')).send(productBody(overrides));
  expect(res.status).toBe(201);
  return res.body.product;
}

describe('Acceso al panel', () => {
  it('una clienta recibe 403 en todas las rutas de administración de catálogo', async () => {
    const { token } = await registerCustomer(app);
    const asCustomer = (req) => req.set('Authorization', `Bearer ${token}`);
    const responses = await Promise.all([
      asCustomer(request(app).get('/api/admin/products')),
      asCustomer(request(app).post('/api/admin/products')).send(productBody()),
      asCustomer(request(app).get('/api/admin/categories')),
      asCustomer(request(app).post('/api/admin/categories')).send({ name: 'Hackeo' }),
    ]);
    responses.forEach((res) => expect(res.status).toBe(403));
    expect(await Product.countDocuments()).toBe(0);
  });

  it('sin sesión responde 401', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
  });
});

describe('Productos (admin)', () => {
  it('crea un producto con slug automático, existencias y campos derivados', async () => {
    const product = await createProduct();
    expect(product.slug).toBe('palazo-de-prueba');
    expect(product.availableSizes).toEqual(['S', 'M']);
    expect(product.totalStock).toBe(5);
    expect(product.isNewArrival).toBe(true);
  });

  it('genera slugs únicos si el nombre se repite', async () => {
    await createProduct();
    const second = await createProduct();
    expect(second.slug).toBe('palazo-de-prueba-2');
  });

  it('ignora campos que no están en la lista blanca', async () => {
    const product = await createProduct({ slug: 'hackeado', totalStock: 999, inStock: true, searchText: 'x' });
    expect(product.slug).toBe('palazo-de-prueba');
    expect(product.totalStock).toBe(5);
  });

  it('ordena las tallas y descarta existencias de colores o tallas que ya no se ofrecen', async () => {
    const product = await createProduct({
      sizes: ['M', 'S'],
      variants: [
        { colorKey: 'negro', size: 'S', stock: 1 },
        { colorKey: 'azul', size: 'S', stock: 9 },
        { colorKey: 'negro', size: 'XL', stock: 9 },
      ],
    });
    expect(product.sizes).toEqual(['S', 'M']);
    expect(product.variants).toEqual([{ colorKey: 'negro', size: 'S', stock: 1 }]);
  });

  it('valida los datos con mensajes claros', async () => {
    const res = await auth(request(app).post('/api/admin/products')).send(
      productBody({ name: '', price: -1, compareAtPrice: 5, colors: [{ key: 'negro', name: 'Negro', hex: 'rojo' }] }),
    );
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'price', 'colors.0.hex']));
  });

  it('rechaza una categoría inexistente', async () => {
    const res = await auth(request(app).post('/api/admin/products')).send(
      productBody({ category: '0123456789abcdef01234567' }),
    );
    expect(res.status).toBe(400);
  });

  it('edita el producto sin cambiar el slug', async () => {
    const product = await createProduct();
    const res = await auth(request(app).put(`/api/admin/products/${product.id}`)).send(
      productBody({ name: 'Nombre nuevo', price: 16, category: blusas.id }),
    );
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ name: 'Nombre nuevo', price: 16, slug: 'palazo-de-prueba' });
  });

  it('activa y desactiva: un producto inactivo no aparece en la tienda', async () => {
    const product = await createProduct();
    await auth(request(app).patch(`/api/admin/products/${product.id}/status`)).send({ active: false });
    const store = await request(app).get('/api/products');
    expect(store.body.total).toBe(0);
    const detail = await request(app).get(`/api/products/${product.slug}`);
    expect(detail.status).toBe(404);
  });

  it('lista con búsqueda y filtros de estado y stock', async () => {
    await createProduct({ name: 'Blusa con poco stock', variants: [{ colorKey: 'negro', size: 'S', stock: 1 }] });
    await createProduct({ name: 'Palazo agotado', variants: [{ colorKey: 'negro', size: 'S', stock: 0 }] });
    await createProduct({ name: 'Palazo inactivo', active: false, variants: [{ colorKey: 'negro', size: 'S', stock: 9 }] });

    const names = (res) => res.body.items.map((p) => p.name).sort();
    expect(names(await auth(request(app).get('/api/admin/products?q=PALAZO')))).toEqual(['Palazo agotado', 'Palazo inactivo']);
    expect(names(await auth(request(app).get('/api/admin/products?stock=agotado')))).toEqual(['Palazo agotado']);
    expect(names(await auth(request(app).get('/api/admin/products?stock=bajo')))).toEqual(['Blusa con poco stock']);
    expect(names(await auth(request(app).get('/api/admin/products?estado=inactivos')))).toEqual(['Palazo inactivo']);

    const all = await auth(request(app).get('/api/admin/products'));
    const low = all.body.items.find((p) => p.name === 'Blusa con poco stock');
    expect(low).toMatchObject({ lowStock: true, totalStock: 1, active: true });
  });

  it('elimina el producto y sus fotos de Cloudinary', async () => {
    const product = await createProduct();
    await auth(request(app).post(`/api/admin/products/${product.id}/images`)).attach('images', PNG, 'a.png');
    const res = await auth(request(app).delete(`/api/admin/products/${product.id}`));
    expect(res.status).toBe(204);
    expect(await Product.countDocuments()).toBe(0);
    expect(imageService.deleteImage).toHaveBeenCalledWith('productos/foto-1');
  });
});

describe('Fotos de producto', () => {
  it('sube varias fotos ligadas a colores, en orden', async () => {
    const product = await createProduct();
    const res = await auth(request(app).post(`/api/admin/products/${product.id}/images`))
      .attach('images', PNG, 'negro.png')
      .attach('images', PNG, 'vino.png')
      .attach('images', PNG, 'general.png')
      .field('colorKeys', 'negro')
      .field('colorKeys', 'vino')
      .field('colorKeys', '');

    expect(res.status).toBe(201);
    const images = res.body.product.images;
    expect(images.map((i) => i.colorKey)).toEqual(['negro', 'vino', null]);
    expect(images.map((i) => i.order)).toEqual([0, 1, 2]);
    expect(images[0].url).toMatch(/^https:\/\/res\.cloudinary\.com/);
  });

  it('rechaza archivos que no son imágenes aunque digan .jpg', async () => {
    const product = await createProduct();
    const res = await auth(request(app).post(`/api/admin/products/${product.id}/images`)).attach('images', FAKE_JPG, {
      filename: 'foto.jpg',
      contentType: 'image/jpeg',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/no es una imagen/);
    expect(imageService.uploadImage).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 5 MB', async () => {
    const product = await createProduct();
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await auth(request(app).post(`/api/admin/products/${product.id}/images`)).attach('images', big, 'grande.png');
    expect(res.status).toBe(413);
  });

  it('no permite más de 8 fotos por producto', async () => {
    const product = await createProduct();
    let req = auth(request(app).post(`/api/admin/products/${product.id}/images`));
    for (let i = 0; i < 6; i++) req = req.attach('images', PNG, `f${i}.png`);
    expect((await req).status).toBe(201);

    let extra = auth(request(app).post(`/api/admin/products/${product.id}/images`));
    for (let i = 0; i < 3; i++) extra = extra.attach('images', PNG, `x${i}.png`);
    const res = await extra;
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Máximo 8 fotos/);
  });

  it('reordena fotos y cambia su color; la primera es la principal', async () => {
    const product = await createProduct();
    const uploaded = await auth(request(app).post(`/api/admin/products/${product.id}/images`))
      .attach('images', PNG, 'a.png')
      .attach('images', PNG, 'b.png');
    const [a, b] = uploaded.body.product.images;

    const res = await auth(request(app).put(`/api/admin/products/${product.id}/images`)).send({
      images: [
        { id: b.id, colorKey: 'vino' },
        { id: a.id, colorKey: null },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.product.images.map((i) => [i.id, i.colorKey, i.order])).toEqual([
      [b.id, 'vino', 0],
      [a.id, null, 1],
    ]);
  });

  it('elimina una foto (también de Cloudinary) y reenumera el orden', async () => {
    const product = await createProduct();
    const uploaded = await auth(request(app).post(`/api/admin/products/${product.id}/images`))
      .attach('images', PNG, 'a.png')
      .attach('images', PNG, 'b.png');
    const [a, b] = uploaded.body.product.images;

    const res = await auth(request(app).delete(`/api/admin/products/${product.id}/images/${a.id}`));
    expect(res.status).toBe(200);
    expect(res.body.product.images).toHaveLength(1);
    expect(res.body.product.images[0]).toMatchObject({ id: b.id, order: 0 });
    expect(imageService.deleteImage).toHaveBeenCalledWith(a.publicId);
  });

  it('si se elimina un color, sus fotos pasan a ser generales', async () => {
    const product = await createProduct();
    await auth(request(app).post(`/api/admin/products/${product.id}/images`))
      .attach('images', PNG, 'vino.png')
      .field('colorKeys', 'vino');

    const res = await auth(request(app).put(`/api/admin/products/${product.id}`)).send(
      productBody({ colors: [{ key: 'negro', name: 'Negro', hex: '#000000' }] }),
    );
    expect(res.status).toBe(200);
    expect(res.body.product.images[0].colorKey).toBeNull();
    expect(res.body.product.variants.every((v) => v.colorKey === 'negro')).toBe(true);
  });
});

describe('Categorías (admin)', () => {
  it('crea categorías con slug y orden automáticos, e incluye las inactivas en el listado', async () => {
    const res = await auth(request(app).post('/api/admin/categories')).send({ name: 'Vestidos de fiesta', active: false });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ slug: 'vestidos-de-fiesta', order: 2, active: false });

    const list = await auth(request(app).get('/api/admin/categories'));
    expect(list.body.categories.map((c) => c.slug)).toEqual(['palazzos', 'blusas', 'vestidos-de-fiesta']);
  });

  it('reordena las categorías', async () => {
    const res = await auth(request(app).put('/api/admin/categories/reorder')).send({ ids: [blusas.id, palazzos.id] });
    expect(res.status).toBe(204);
    const store = await request(app).get('/api/categories');
    expect(store.body.categories.map((c) => c.slug)).toEqual(['blusas', 'palazzos']);
  });

  it('no elimina una categoría con productos, pero sí una vacía', async () => {
    await createProduct();
    const blocked = await auth(request(app).delete(`/api/admin/categories/${palazzos.id}`));
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toMatch(/tiene 1 producto/);

    const ok = await auth(request(app).delete(`/api/admin/categories/${blusas.id}`));
    expect(ok.status).toBe(204);
  });

  it('asigna y reemplaza la imagen del mosaico, borrando la anterior de Cloudinary', async () => {
    const first = await auth(request(app).put(`/api/admin/categories/${palazzos.id}/image`)).attach('image', PNG, 'a.png');
    expect(first.status).toBe(200);
    const firstId = first.body.category.image.publicId;

    const second = await auth(request(app).put(`/api/admin/categories/${palazzos.id}/image`)).attach('image', PNG, 'b.png');
    expect(second.body.category.image.publicId).not.toBe(firstId);
    expect(imageService.deleteImage).toHaveBeenCalledWith(firstId);
  });
});
