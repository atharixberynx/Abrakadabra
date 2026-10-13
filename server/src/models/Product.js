/**
 * Producto (prenda).
 *
 * Colores, existencias e imágenes:
 *  - `colors`: solo los colores en que se ofrece ESTA prenda. Cada uno tiene una `key`
 *    fija (no cambia aunque se renombre el color) que usan variantes e imágenes.
 *  - `variants`: combinaciones color + talla que se ofrecen, con su stock.
 *    Si una combinación no está en la lista, no se ofrece (p. ej. "rojo solo en S y M").
 *    Si está con stock 0, aparece como agotada.
 *  - `images`: hasta 8. Cada una puede ir ligada a un color (`colorKey`): al elegir ese
 *    color en la tienda, se muestran sus fotos. `order` 0 es la principal.
 *
 * Campos derivados (se calculan solos antes de guardar, no se editan a mano):
 *  availableSizes, availableColors, inStock, totalStock, searchText.
 *  Existen para que los filtros del catálogo sean consultas simples y rápidas.
 */
import mongoose from 'mongoose';
import { normalizeText, round2 } from '../utils/text.js';

export const SIZES = ['S', 'M', 'L', 'XL', 'Única'];
export const MAX_IMAGES = 8;
export const LOW_STOCK_THRESHOLD = 2;

const colorSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, match: /^[a-z0-9-]{1,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    hex: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    colorKey: { type: String, required: true },
    size: { type: String, required: true, enum: SIZES },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'El stock debe ser un número entero' },
    },
  },
  { _id: false },
);

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: null }, // id en Cloudinary; null en imágenes de ejemplo
  colorKey: { type: String, default: null }, // null = foto general (se muestra con todos los colores)
  order: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    price: { type: Number, required: true, min: 0, set: round2 },
    // Precio anterior (tachado) para ofertas. null = sin oferta
    compareAtPrice: { type: Number, default: null, min: 0, set: round2 },

    colors: { type: [colorSchema], default: [] },
    sizes: { type: [{ type: String, enum: SIZES }], default: [] },
    variants: { type: [variantSchema], default: [] },
    images: { type: [imageSchema], default: [] },

    // "isNew" es un nombre reservado de Mongoose, por eso isNewArrival
    isNewArrival: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // ── Derivados (ver comentario superior) ──
    availableSizes: { type: [String], default: [] },
    availableColors: { type: [String], default: [] }, // nombres en minúsculas
    inStock: { type: Boolean, default: false },
    totalStock: { type: Number, default: 0 },
    searchText: { type: String, default: '', select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.searchText;
        ret.images = (ret.images ?? [])
          .sort((a, b) => a.order - b.order)
          .map(({ _id, ...image }) => ({ id: _id.toString(), ...image }));
        return ret;
      },
    },
  },
);

productSchema.index({ active: 1, category: 1, inStock: -1, createdAt: -1 });
productSchema.index({ active: 1, isNewArrival: 1 });
productSchema.index({ active: 1, price: 1 });

/** Recalcula los campos derivados a partir de variantes y colores */
export function computeDerivedFields(product) {
  const inStockVariants = product.variants.filter((v) => v.stock > 0);
  const colorNameByKey = new Map(product.colors.map((c) => [c.key, c.name.toLowerCase()]));

  product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  product.inStock = inStockVariants.length > 0;
  product.availableSizes = SIZES.filter((size) => inStockVariants.some((v) => v.size === size));
  product.availableColors = [
    ...new Set(inStockVariants.map((v) => colorNameByKey.get(v.colorKey)).filter(Boolean)),
  ];
  product.searchText = normalizeText(`${product.name} ${product.colors.map((c) => c.name).join(' ')}`);
}

// Validaciones de coherencia + cálculo de derivados antes de guardar
productSchema.pre('validate', function () {
  const colorKeys = new Set(this.colors.map((c) => c.key));

  if (colorKeys.size !== this.colors.length) {
    this.invalidate('colors', 'Hay colores repetidos');
  }
  if (this.compareAtPrice !== null && this.compareAtPrice <= this.price) {
    this.invalidate('compareAtPrice', 'El precio anterior debe ser mayor que el precio actual');
  }
  if (this.images.length > MAX_IMAGES) {
    this.invalidate('images', `Máximo ${MAX_IMAGES} imágenes por producto`);
  }

  const seen = new Set();
  for (const variant of this.variants) {
    const id = `${variant.colorKey}|${variant.size}`;
    if (!colorKeys.has(variant.colorKey)) {
      this.invalidate('variants', 'Hay existencias para un color que no está en la lista de colores');
    }
    if (!this.sizes.includes(variant.size)) {
      this.invalidate('variants', `La talla ${variant.size} no está en la lista de tallas`);
    }
    if (seen.has(id)) this.invalidate('variants', 'Hay combinaciones color + talla repetidas');
    seen.add(id);
  }

  for (const image of this.images) {
    if (image.colorKey && !colorKeys.has(image.colorKey)) {
      this.invalidate('images', 'Una imagen está ligada a un color que no existe');
    }
  }

  computeDerivedFields(this);
});

export const Product = mongoose.model('Product', productSchema);
