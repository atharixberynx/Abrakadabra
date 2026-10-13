/**
 * Proveedor de pagos SIMULADO (modo de prueba: no se realiza ningún cargo real).
 *
 * Tarjetas de prueba:
 *   4242 4242 4242 4242 → aprobada
 *   4000 0000 0000 0002 → rechazada
 *   4000 0000 0000 9995 → fondos insuficientes
 *   Cualquier otra tarjeta válida (Luhn) → aprobada
 *
 * Simula la demora de un banco (1 a 2 segundos). En pruebas automatizadas no espera.
 */
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { onlyDigits } from './card.js';

const DECLINED = {
  '4000000000000002': { reason: 'tarjeta_rechazada', message: 'Tu banco rechazó la tarjeta. Prueba con otra tarjeta.' },
  '4000000000009995': { reason: 'fondos_insuficientes', message: 'La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.' },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulatedProvider = {
  name: 'simulated',

  /**
   * @param {{ amount: number, card: { number: string }, orderId: string }} params
   * @returns {Promise<{ approved: boolean, transactionId: string|null, reason?: string, message?: string }>}
   */
  async processPayment({ card }) {
    if (!env.isTest) await wait(1000 + Math.random() * 1000);

    const declined = DECLINED[onlyDigits(card.number)];
    if (declined) return { approved: false, transactionId: null, ...declined };

    return { approved: true, transactionId: `SIM-${crypto.randomBytes(6).toString('hex').toUpperCase()}` };
  },
};
