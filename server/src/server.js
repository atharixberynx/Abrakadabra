/**
 * Punto de entrada: conecta a MongoDB y levanta el servidor HTTP.
 */
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
  } catch (err) {
    logger.fatal(
      { err: { message: err.message } },
      'No se pudo conectar a MongoDB. Revisa MONGODB_URI y el acceso de red en Atlas.',
    );
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API escuchando en http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  });

  // Cierre ordenado (Render envía SIGTERM al redeplegar)
  const shutdown = async (signal) => {
    logger.info(`${signal} recibido, cerrando…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
