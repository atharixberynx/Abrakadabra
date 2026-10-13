import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Imagen del mosaico de categorías en la página de inicio
    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null }, // id en Cloudinary (para poder borrarla)
    },
    order: { type: Number, default: 0 }, // posición en menús y mosaico (menor = primero)
    active: { type: Boolean, default: true },
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

categorySchema.index({ active: 1, order: 1 });

export const Category = mongoose.model('Category', categorySchema);
