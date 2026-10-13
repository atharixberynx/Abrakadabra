/**
 * Punto de entrada: conecta a MongoDB y levanta el servidor HTTP.
 */
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { releaseStalePendingOrders } from './services/orderService.js';

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

  // Pedidos que quedaron "pendientes de pago" (p. ej. por un reinicio a mitad de un cobro):
  // se libera su stock al arrancar y luego cada 10 minutos.
  const releasePending = () => releaseStalePendingOrders().catch((err) => logger.error({ err }, 'Error al liberar pedidos pendientes'));
  releasePending();
  setInterval(releasePending, 10 * 60 * 1000).unref();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API escuchando en http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.fatal(
        `El puerto ${env.PORT} ya está en uso. ¿Tienes otra terminal con "npm run dev" abierta?`,
      );
    } else {
      logger.fatal({ err }, 'No se pudo iniciar el servidor');
    }
    process.exit(1);
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
