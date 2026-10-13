import mongoose from 'mongoose';

export const ROLES = ['customer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    // `select: false`: nunca sale en las consultas salvo que se pida explícitamente
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer' },
  },
  {
    timestamps: true,
    toJSON: {
      // Forma pública del usuario: sin hash, sin __v y con `id` en vez de `_id`
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
