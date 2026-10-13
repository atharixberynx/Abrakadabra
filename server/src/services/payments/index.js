/**
 * Adaptador de pagos: una sola interfaz para cualquier proveedor.
 *
 *   const result = await paymentProvider.processPayment({ amount, card, orderId });
 *   result → { approved, transactionId, reason?, message? }
 *
 * El proveedor se elige con PAYMENT_PROVIDER en server/.env (simulated | wompi).
 */
import { env } from '../../config/env.js';
import { simulatedProvider } from './simulatedProvider.js';
import { wompiProvider } from './wompiProvider.js';

const providers = { simulated: simulatedProvider, wompi: wompiProvider };

export const paymentProvider = providers[env.PAYMENT_PROVIDER];
export const isTestMode = env.PAYMENT_PROVIDER === 'simulated';
