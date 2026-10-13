/**
 * Contadores secuenciales (p. ej. el número de pedido ABK-000123).
 * Se incrementan con $inc atómico, así dos compras simultáneas nunca reciben el mismo número.
 */
import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);

export async function nextSequence(name, session) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session },
  );
  return counter.seq;
}
