/**
 * Base de datos de pruebas: MongoDB en memoria (replica set de 1 nodo, para poder
 * usar transacciones). Nunca toca Atlas. Cada archivo de pruebas tiene la suya
 * y se limpia entre pruebas.
 *
 * La primera ejecución descarga el binario de MongoDB (puede tardar un poco).
 */
import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { resetSettingsCache } from '../../src/services/settingsService.js';

export function useTestDatabase() {
  let replSet;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await connectDB(replSet.getUri('abrakadabra-test'));
    // Asegura que existan los índices (p. ej. correo único) antes de las pruebas
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  });

  afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
    resetSettingsCache(); // los ajustes se guardan en caché en memoria
  });

  afterAll(async () => {
    await disconnectDB();
    await replSet?.stop();
  });
}
