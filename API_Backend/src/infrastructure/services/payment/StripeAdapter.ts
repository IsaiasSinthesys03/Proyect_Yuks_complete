import Stripe from 'stripe';
import { IPaymentGateway } from '../../../application/interfaces/IPaymentGateway';
import { WebhookEventDTO } from '../../../domain/types/PaymentDTOs';
import { WebhookSignatureInvalidError } from '../../../domain/errors/CheckoutErrors';

/**
 * Implementación concreta de IPaymentGateway usando Stripe.
 *
 * REQ-BE-02: Soporte 3D Secure 2.0 (manejado automáticamente por Stripe
 * a través del flujo de confirmación del PaymentIntent en el frontend)
 * y validación de Webhooks mediante firma HMAC.
 */
export class StripeAdapter implements IPaymentGateway {
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe no devolvió un client_secret para el PaymentIntent.');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async refund(paymentIntentId: string, amount?: number): Promise<{ refundId: string }> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount !== undefined ? Math.round(amount * 100) : undefined,
    });

    return { refundId: refund.id };
  }

  parseWebhookEvent(payload: Buffer, signature: string): WebhookEventDTO {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch {
      throw new WebhookSignatureInvalidError();
    }

    // ÚNICO lugar del sistema que conoce la forma de un evento de Stripe.
    // Cualquier Use Case que consuma IPaymentGateway solo ve WebhookEventDTO.
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        // Extraer el charge ID del último cargo exitoso (si existe)
        const chargeId = typeof intent.latest_charge === 'string'
          ? intent.latest_charge
          : (intent.latest_charge as Stripe.Charge | null)?.id;
        return {
          type: 'PAYMENT_SUCCESS',
          providerOrderId: intent.id,
          metadata: (intent.metadata ?? {}) as Record<string, string>,
          chargeId,
        };
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        return {
          type: 'PAYMENT_FAILED',
          providerOrderId: intent.id,
          metadata: (intent.metadata ?? {}) as Record<string, string>,
        };
      }
      default:
        return { type: 'UNHANDLED', providerOrderId: '' };
    }
  }
}
