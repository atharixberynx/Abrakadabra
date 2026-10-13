import mongoose from 'mongoose';
import { slugify } from './text.js';

/**
 * Slug único para un modelo: "palazo-de-vestir", y si ya existe, "palazo-de-vestir-2", "-3"…
 * `excludeId` permite ignorar el propio documento al editar.
 */
export async function uniqueSlug(Model, text, fallback, excludeId) {
  const base = slugify(text) || fallback;
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const filter = { slug: candidate };
    if (excludeId) filter._id = mongoose.trusted({ $ne: excludeId });
    if (!(await Model.exists(filter))) return candidate;
  }
  return `${base}-${Date.now()}`;
}
