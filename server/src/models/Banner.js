/**
 * Banners del carrusel de la página de inicio.
 *  - imageDesktop: obligatoria. Llena todo el carrusel (si la proporción no coincide, se recortan bordes).
 *  - imageMobile: opcional. Si no hay, en el celular se usa la de escritorio.
 *  - link: a dónde lleva al tocarlo (ruta de la tienda como "/catalogo" o un enlace https).
 *  - title / subtitle / buttonText: texto OPCIONAL que se escribe sobre la imagen con las
 *    fuentes de la marca (útil si la foto no trae texto). textTheme elige texto claro u oscuro.
 */
import mongoose from 'mongoose';

export const MAX_BANNERS = 6;

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null }, // null en el banner predeterminado (archivo de la tienda)
  },
  { _id: false },
);

const bannerSchema = new mongoose.Schema(
  {
    imageDesktop: { type: imageSchema, required: true },
    imageMobile: { type: imageSchema, default: () => ({}) },
    // Texto alternativo: lo leen los lectores de pantalla y Google
    alt: { type: String, trim: true, maxlength: 120, default: 'Banner de Abrakadabra Fashion Shop' },
    link: { type: String, trim: true, maxlength: 300, default: '/catalogo' },
    title: { type: String, trim: true, maxlength: 80, default: '' },
    subtitle: { type: String, trim: true, maxlength: 140, default: '' },
    buttonText: { type: String, trim: true, maxlength: 30, default: '' },
    // light = texto blanco (para fotos oscuras) · dark = texto morado oscuro (para fotos claras)
    textTheme: { type: String, enum: ['light', 'dark'], default: 'light' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

bannerSchema.index({ active: 1, order: 1 });

export const Banner = mongoose.model('Banner', bannerSchema);
