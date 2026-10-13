import mongoose from 'mongoose';
import { logger } from './logger.js';

// Solo se permiten en los filtros los campos definidos en los esquemas
mongoose.set('strictQuery', true);
// Envuelve en $eq cualquier objeto con operadores ($gt, $ne…) que llegue en un filtro.
// Es una segunda capa contra inyección NoSQL (la primera es el middleware sanitizeRequest).
//
// Consecuencias al escribir consultas:
//  - Los operadores que pone el código a propósito deben marcarse como confiables:
//      Product.find({ price: mongoose.trusted({ $gte: 5, $lte: 20 }) })
//    (Ojo: `.setOptions({ sanitizeFilter: false })` NO lo desactiva; usa siempre trusted).
//  - $and / $or / $nor sí se permiten en el primer nivel.
//  - $text, $where y $expr están prohibidos (la búsqueda usa regex escapada).
mongoose.set('sanitizeFilter', true);

export async function connectDB(uri) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconectado'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB conectado (base de datos: ${mongoose.connection.name})`);
}

export async function disconnectDB() {
  // Desconexión intencional: no mostrar la advertencia de "desconectado"
  mongoose.connection.removeAllListeners('disconnected');
  await mongoose.disconnect();
}

/** Estado legible de la conexión, usado por /api/health */
export function dbState() {
  const states = ['desconectada', 'conectada', 'conectando', 'desconectando'];
  return states[mongoose.connection.readyState] ?? 'desconocido';
}
