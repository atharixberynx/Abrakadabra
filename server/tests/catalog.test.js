import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { useTestDatabase } from './helpers/db.js';

useTestDatabase();
const app = createApp();

const black = { key: 'negro', name: 'Negro', hex: '#000000' };
const pink = { key: 'rosa-palo', name: 'Rosa palo', hex: '#E8B4B8' };

let palazzos;

beforeEach(async () => {
  palazzos = await Category.create({ name: 'Palazzos', slug: 'palazzos', order: 0 });
  const blusas = await Category.create({ name: 'Blusas', slug: 'blusas', order: 1 });
  await Category.create({ name: 'Oculta', slug: 'oculta', order: 2, active: false });

  await Product.create([
    {
      name: 'Palazo de vestir',
      slug: 'palazo-de-vestir',
      category: palazzos._id,
      price: 14.5,
      colors: [black, pink],
      sizes: ['S', 'M', 'XL'],
      variants: [
        { colorKey: 'negro', size: 'S', stock: 3 },
        { colorKey: 'negro', size: 'XL', stock: 1 },
        { colorKey: 'rosa-palo', size: 'M', stock: 0 },
      ],
      images: [{ url: '/a.svg', colorKey: 'negro', order: 0 }],
      isNewArrival: true,
    },
    {
      name: 'Pantalón económico',
      slug: 'pantalon-economico',
      category: palazzos._id,
      price: 8,
      compareAtPrice: 10,
      colors: [pink],
      sizes: ['M'],
      variants: [{ colorKey: 'rosa-palo', size: 'M', stock: 5 }],
    },
    {
      name: 'Palazo agotado',
      slug: 'palazo-agotado',
      category: palazzos._id,
      price: 5,
      colors: [black],
      sizes: ['L'],
      variants: [{ colorKey: 'negro', size: 'L', stock: 0 }],
    },
    {
      name: 'Blusa básica',
      slug: 'blusa-basica',
      category: blusas._id,
      price: 9,
      colors: [black],
      sizes: ['S'],
      variants: [{ colorKey: 'negro', size: 'S', stock: 2 }],
    },
    {
      name: 'Producto inactivo',
      slug: 'producto-inactivo',
      category: blusas._id,
      price: 9,
      active: false,
    },
  ]);
});

const slugs = (res) => res.body.items.map((p) => p.slug);

describe('Modelo Product', () => {
  it('calcula tallas y colores disponibles solo con las combinaciones que tienen stock', async () => {
    const product = await Product.findOne({ slug: 'palazo-de-vestir' });
    expect(product.availableSizes).toEqual(['S', 'XL']);
    expect(product.availableColors).toEqual(['negro']);
    expect(product.totalStock).toBe(4);
    expect(product.inStock).toBe(true);
  });

  it('redondea precios a 2 decimales', async () => {
    const product = await Product.create({
      name: 'Redondeo',
      slug: 'redondeo',
      category: palazzos._id,
      price: 10.005,
    });
    expect(product.price).toBe(10.01);
  });

  it('rechaza existencias de colores o tallas que el producto no ofrece', async () => {
    await expect(
      Product.create({
        name: 'Incoherente',
        slug: 'incoherente',
        category: palazzos._id,
        price: 10,
        colors: [black],
        sizes: ['S'],
        variants: [{ colorKey: 'azul', size: 'M', stock: 1 }],
      }),
    ).rejects.toThrow(/color que no está|talla M/);
  });

  it('rechaza un precio anterior que no sea mayor al precio actual', async () => {
    await expect(
      Product.create({ name: 'Oferta mala', slug: 'oferta-mala', category: palazzos._id, price: 10, compareAtPrice: 9 }),
    ).rejects.toThrow(/precio anterior/);
  });
});

describe('GET /api/categories', () => {
  it('lista solo categorías activas, en orden y con su número de productos activos', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories.map((c) => c.slug)).toEqual(['palazzos', 'blusas']);
    expect(res.body.categories[0].productCount).toBe(3);
    expect(res.body.categories[1].productCount).toBe(1); // el inactivo no cuenta
  });
});

describe('GET /api/products', () => {
  it('devuelve solo productos activos con los datos de la tarjeta, agotados al final', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(slugs(res)).not.toContain('producto-inactivo');
    expect(slugs(res).at(-1)).toBe('palazo-agotado');

    const card = res.body.items.find((p) => p.slug === 'palazo-de-vestir');
    expect(card).toMatchObject({
      name: 'Palazo de vestir',
      price: 14.5,
      category: { slug: 'palazzos', name: 'Palazzos' },
      availableSizes: ['S', 'XL'],
      isNewArrival: true,
    });
    expect(card.colors).toHaveLength(2);
    expect(card.variants).toBeUndefined();
    expect(card.searchText).toBeUndefined();
  });

  it('filtra por categoría, talla, color y rango de precio', async () => {
    const byCategory = await request(app).get('/api/products?categoria=blusas');
    expect(slugs(byCategory)).toEqual(['blusa-basica']);

    const bySize = await request(app).get('/api/products?talla=XL');
    expect(slugs(bySize)).toEqual(['palazo-de-vestir']);

    const bySizes = await request(app).get('/api/products?talla=XL&talla=M');
    expect(slugs(bySizes).sort()).toEqual(['palazo-de-vestir', 'pantalon-economico']);

    const byColor = await request(app).get('/api/products?color=Rosa%20palo');
    expect(slugs(byColor)).toEqual(['pantalon-economico']); // en el palazo, el rosa está agotado

    const byPrice = await request(app).get('/api/products?min=8&max=10');
    expect(slugs(byPrice).sort()).toEqual(['blusa-basica', 'pantalon-economico']);
  });

  it('busca por nombre sin importar tildes ni mayúsculas', async () => {
    const res = await request(app).get('/api/products?q=PANTALON');
    expect(slugs(res)).toEqual(['pantalon-economico']);
  });

  it('trata caracteres especiales de la búsqueda como texto (sin regex inyectada)', async () => {
    const res = await request(app).get('/api/products?q=.*');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('ordena por precio y pagina los resultados', async () => {
    const asc = await request(app).get('/api/products?orden=precio-asc');
    expect(slugs(asc)).toEqual(['pantalon-economico', 'blusa-basica', 'palazo-de-vestir', 'palazo-agotado']);

    const page2 = await request(app).get('/api/products?orden=precio-asc&limit=3&page=2');
    expect(page2.body).toMatchObject({ page: 2, totalPages: 2, total: 4 });
    expect(slugs(page2)).toEqual(['palazo-agotado']);
  });

  it('filtra productos nuevos', async () => {
    const res = await request(app).get('/api/products?nuevos=1');
    expect(slugs(res)).toEqual(['palazo-de-vestir']);
  });

  it('responde vacío si la categoría no existe o está inactiva', async () => {
    const res = await request(app).get('/api/products?categoria=oculta');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('rechaza parámetros inválidos', async () => {
    expect((await request(app).get('/api/products?talla=XXL')).status).toBe(400);
    expect((await request(app).get('/api/products?orden=hackeo')).status).toBe(400);
    expect((await request(app).get('/api/products?limit=1000')).status).toBe(400);
  });
});

describe('GET /api/products/filters', () => {
  it('devuelve solo las tallas y colores con existencias, y el rango de precios', async () => {
    const res = await request(app).get('/api/products/filters?categoria=palazzos');
    expect(res.status).toBe(200);
    expect(res.body.sizes).toEqual(['S', 'M', 'XL']);
    expect(res.body.colors.map((c) => c.name).sort()).toEqual(['Negro', 'Rosa palo']);
    expect(res.body.price).toEqual({ min: 8, max: 14.5 });
  });
});

describe('GET /api/products/:slug', () => {
  it('devuelve el detalle completo con variantes e imágenes', async () => {
    const res = await request(app).get('/api/products/palazo-de-vestir');
    expect(res.status).toBe(200);
    expect(res.body.product.variants).toHaveLength(3);
    expect(res.body.product.images[0]).toMatchObject({ url: '/a.svg', colorKey: 'negro' });
    expect(res.body.product.category.slug).toBe('palazzos');
  });

  it('responde 404 para productos inactivos o inexistentes y 400 para slugs inválidos', async () => {
    expect((await request(app).get('/api/products/producto-inactivo')).status).toBe(404);
    expect((await request(app).get('/api/products/no-existe')).status).toBe(404);
    expect((await request(app).get('/api/products/Slug$Malo')).status).toBe(400);
  });

  it('sugiere productos relacionados de la misma categoría sin incluir el actual', async () => {
    const res = await request(app).get('/api/products/palazo-de-vestir/related');
    expect(res.status).toBe(200);
    expect(slugs(res).sort()).toEqual(['palazo-agotado', 'pantalon-economico']);
  });
});
