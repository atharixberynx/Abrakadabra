/**
 * Proveedor de pagos Wompi EL SALVADOR (esqueleto, pendiente de integrar).
 * Documentación: https://docs.wompi.sv   ⚠️ No confundir con Wompi Colombia (docs.wompi.co).
 *
 * Para activarlo: PAYMENT_PROVIDER=wompi en server/.env y completar los TODO.
 *
 * TODO (integración real):
 *  1. Agregar a env.js y .env.example: WOMPI_CLIENT_ID, WOMPI_CLIENT_SECRET, WOMPI_APP_ID
 *     (se obtienen en el panel de Wompi SV, sección "Aplicativos").
 *  2. Obtener un token de acceso OAuth2 (client_credentials) en el servidor de identidad de
 *     Wompi SV y cachearlo hasta que venza.
 *  3. Crear la transacción con los datos de la tarjeta (o, mejor, usar un enlace de pago /
 *     tokenización para que la tarjeta nunca pase por este servidor y reducir el alcance PCI).
 *  4. Manejar la autenticación 3D Secure si el banco la exige (redirección y webhook).
 *  5. Configurar el webhook de Wompi para confirmar el pago de forma asíncrona y validar su firma.
 *  6. Mapear la respuesta a { approved, transactionId, reason, message } como el simulador.
 *  7. Nunca registrar en logs el número de tarjeta, el CVV ni los tokens de Wompi.
 */
import { HttpError } from '../../utils/httpError.js';

export const wompiProvider = {
  name: 'wompi',

  // eslint-disable-next-line no-unused-vars
  async processPayment({ amount, card, orderId }) {
    // TODO: implementar con la API de Wompi El Salvador (ver pasos arriba)
    throw new HttpError(503, 'El pago con Wompi todavía no está disponible. Usa PAYMENT_PROVIDER=simulated.');
  },
};
