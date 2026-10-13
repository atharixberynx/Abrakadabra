/**
 * Revalida el carrito contra la base de datos: precios actuales, existencias y
 * productos que ya no están disponibles. Lo usan el carrito y el checkout.
 *
 * Avisos por línea (issues):
 *  - no_disponible:      el producto, color o talla ya no se vende
 *  - agotado:            no queda stock de esa combinación
 *  - stock_insuficiente: hay menos unidades que las pedidas (ver availableQuantity)
 *  - precio_cambio:      el precio es distinto al que vio la clienta (no bloquea)
 */
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { round2 } from '../utils/text.js';

export const BLOCKING_ISSUES = ['no_disponible', 'agotado', 'stock_insuficiente'];

const lineKey = (item) => `${item.productId}|${item.colorKey}|${item.size}`;

/** Une líneas repetidas del mismo producto + color + talla */
function mergeItems(items) {
  const merged = new Map();
  for (const item of items) {
    const key = lineKey(item);
    const current = merged.get(key);
    merged.set(key, current ? { ...current, quantity: current.quantity + item.quantity } : { ...item });
  }
  return [...merged.values()];
}

function imageForColor(product, colorKey) {
  const images = [...product.images].sort((a, b) => a.order - b.order);
  return (images.find((img) => img.colorKey === colorKey) ?? images[0])?.url ?? null;
}

export async function validateCart(items) {
  const merged = mergeItems(items);
  const ids = [...new Set(merged.map((i) => i.productId))];
  const products = await Product.find({ _id: mongoose.trusted({ $in: ids }) })
    .select('name slug price active colors variants images')
    .lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = merged.map((item) => {
    const product = byId.get(item.productId);
    const color = product?.colors.find((c) => c.key === item.colorKey);
    const variant = product?.variants.find((v) => v.colorKey === item.colorKey && v.size === item.size);
    const issues = [];

    if (!product || !product.active || !color || !variant) {
      return {
        key: lineKey(item),
        productId: item.productId,
        colorKey: item.colorKey,
        size: item.size,
        quantity: item.quantity,
        availableQuantity: 0,
        name: product?.name ?? 'Producto',
        issues: ['no_disponible'],
      };
    }

    if (variant.stock <= 0) issues.push('agotado');
    else if (item.quantity > variant.stock) issues.push('stock_insuficiente');
    if (item.price !== undefined && round2(item.price) !== product.price) issues.push('precio_cambio');

    return {
      key: lineKey(item),
      productId: item.productId,
      slug: product.slug,
      name: product.name,
      image: imageForColor(product, item.colorKey),
      colorKey: item.colorKey,
      colorName: color.name,
      size: item.size,
      quantity: item.quantity,
      availableQuantity: variant.stock,
      unitPrice: product.price,
      previousPrice: issues.includes('precio_cambio') ? round2(item.price) : undefined,
      lineTotal: round2(product.price * item.quantity),
      issues,
    };
  });

  const purchasable = lines.filter((l) => !l.issues.some((i) => BLOCKING_ISSUES.includes(i)));
  return {
    ok: purchasable.length === lines.length && lines.length > 0,
    lines,
    total: round2(purchasable.reduce((sum, l) => sum + l.lineTotal, 0)),
  };
}
