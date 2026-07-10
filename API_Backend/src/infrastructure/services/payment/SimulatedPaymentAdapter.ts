import * as crypto from 'crypto';
import { IPaymentGateway } from '../../../application/interfaces/IPaymentGateway';
import { WebhookEventDTO } from '../../../domain/types/PaymentDTOs';

/**
 * ▓▓▓ ADAPTADOR DE PAGO SIMULADO — SOLO DESARROLLO ▓▓▓
 *
 * TODO: STRIPE — Este adaptador existe ÚNICAMENTE porque aún no hay claves
 * reales de Stripe (sk_test_/pk_test_). Cuando estén disponibles:
 *   1. Poner las claves reales en API_Backend/.env (STRIPE_SECRET_KEY) y
 *      Plantilla_Prototipos_UI_UX/.env (VITE_STRIPE_PUBLISHABLE_KEY).
 *   2. Quitar `PAYMENTS_SIMULATED=true` del .env del backend.
 *   3. El Composition Root (main.ts) volverá a inyectar StripeAdapter
 *      automáticamente — este archivo no se usa más (puede borrarse).
 *
 * Comportamiento: genera un PaymentIntent FICTICIO (id `pi_sim_...`) para que
 * `ProcessCheckoutUseCase` pueda crear la orden real en la BD con estado
 * PAYMENT_PENDING. NUNCA cobra nada. La transición a PAID requiere el webhook
 * de Stripe real, por lo que en simulación las órdenes quedan PAYMENT_PENDING.
 */
export class SimulatedPaymentAdapter implements IPaymentGateway {
  constructor() {
    console.warn('⚠️⚠️⚠️  PAGOS SIMULADOS ACTIVOS (PAYMENTS_SIMULATED=true). NINGÚN COBRO ES REAL. NO USAR EN PRODUCCIÓN. [TODO: STRIPE]');
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const id = `pi_sim_${crypto.randomBytes(12).toString('hex')}`;
    console.warn(`⚠️  [SIMULADO] PaymentIntent ficticio ${id} por ${amount} ${currency} (user ${metadata.userId ?? '?'}). No se cobró nada.`);
    return {
      paymentIntentId: id,
      clientSecret: `${id}_secret_${crypto.randomBytes(8).toString('hex')}`,
    };
  }

  async refund(paymentIntentId: string, _amount?: number): Promise<{ refundId: string }> {
    console.warn(`⚠️  [SIMULADO] Refund ficticio para ${paymentIntentId}.`);
    return { refundId: `re_sim_${crypto.randomBytes(12).toString('hex')}` };
  }

  parseWebhookEvent(_payload: Buffer, _signature: string): WebhookEventDTO {
    // En modo simulado no existen webhooks válidos: rechazar SIEMPRE evita
    // que alguien fabrique confirmaciones de pago contra este entorno.
    throw new Error('Webhooks deshabilitados en modo de pagos simulados (PAYMENTS_SIMULATED).');
  }
}
