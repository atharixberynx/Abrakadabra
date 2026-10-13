/**
 * Ajustes de la tienda (un solo documento, _id "tienda"), editables en Panel › Ajustes.
 * Los textos largos de las páginas informativas NO van aquí: están en
 * client/src/content/paginas-informativas.json.
 */
import mongoose from 'mongoose';

const hourSchema = new mongoose.Schema(
  {
    days: { type: String, required: true, trim: true, maxlength: 40 }, // "Lunes a viernes"
    time: { type: String, required: true, trim: true, maxlength: 60 }, // "8:00 a. m. a 4:30 p. m."
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'tienda' },
    announcements: { type: [{ type: String, trim: true, maxlength: 90 }], default: [] },
    whatsappNumber: { type: String, trim: true }, // con código de país, solo dígitos: 50377777777
    address: {
      line1: { type: String, trim: true, maxlength: 120 },
      line2: { type: String, trim: true, maxlength: 120 },
      city: { type: String, trim: true, maxlength: 120 },
    },
    hours: { type: [hourSchema], default: [] },
    mapsUrl: { type: String, trim: true, maxlength: 500 }, // enlace "Cómo llegar"
    instagramUrl: { type: String, trim: true, maxlength: 200, default: '' },
    facebookUrl: { type: String, trim: true, maxlength: 200, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Settings = mongoose.model('Settings', settingsSchema);
