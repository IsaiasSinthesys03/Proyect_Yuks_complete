import { FastifyRequest, FastifyReply } from 'fastify';
import { WebhookPaymentReconciliationUseCase } from '../../../application/use_cases/orders/WebhookPaymentReconciliationUseCase';
import { ConfirmDonationWebhookUseCase } from '../../../application/use_cases/donations/ConfirmDonationWebhookUseCase';
import { WebhookSignatureInvalidError, StockExpiredAfter3DSecureError } from '../../../domain/errors/CheckoutErrors';
import { DonationNotFoundError } from '../../../domain/errors/DonationErrors';

/**
 * Controlador HTTP de Webhooks de la Pasarela de Pago (REQ-BE-02, REQ-BE-09).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 *
 * ENRUTAMIENTO DE WEBHOOKS:
 *   Todos los eventos de Stripe llegan a un único endpoint `/api/webhooks/stripe`.
 *   El controlador encadena los use cases en orden de prioridad:
 *   1. WebhookPaymentReconciliationUseCase — intenta procesar como pago de orden.
 *   2. ConfirmDonationWebhookUseCase — si la orden no fue encontrada (handled=false),
 *      intenta procesar como confirmación de donación.
 *   La firma HMAC se valida en cada use case de forma independiente (idempotente).
 *
 * CRÍTICO: `request.body` DEBE llegar como Buffer crudo (sin parsear JSON).
 */
export class WebhookController {
  constructor(
    private readonly webhookReconciliationUseCase: WebhookPaymentReconciliationUseCase,
    private readonly confirmDonationWebhookUseCase: ConfirmDonationWebhookUseCase
  ) {}

  /** POST /api/webhooks/stripe */
  async handleStripeWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const rawBody = request.body as Buffer;
      const signature = request.headers['stripe-signature'] as string | undefined;

      if (!signature) {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'El header "stripe-signature" es obligatorio.',
        });
        return;
      }

      // Paso 1: Intentar procesar como pago de orden
      const orderResult = await this.webhookReconciliationUseCase.execute(rawBody, signature);
      if (orderResult.handled) {
        return reply.status(200).send({ received: true, ...orderResult });
      }

      // Paso 2: Si la orden no fue encontrada, intentar procesar como donación
      const donationResult = await this.confirmDonationWebhookUseCase.execute(rawBody, signature);

      // Stripe espera 200 para no reintentar, independientemente del resultado
      return reply.status(200).send({ received: true, ...donationResult });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof WebhookSignatureInvalidError) {
      reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: error.message });
      return;
    }

    if (error instanceof StockExpiredAfter3DSecureError) {
      // Resolución #1: el reembolso automático ya se ejecutó dentro del Use Case.
      // Se responde 200 para que Stripe no reintente el webhook.
      reply.status(200).send({ received: true, autoRefunded: true, message: error.message });
      return;
    }

    if (error instanceof DonationNotFoundError) {
      // El webhook de donación llegó antes de que se creara el registro PENDING.
      // Esto no debería ocurrir en flujo normal — responder 200 para no reintentar.
      console.error('⚠️ Webhook de donación sin registro PENDING en BD:', error);
      reply.status(200).send({ received: true, handled: false, warning: 'Donación no encontrada en BD.' });
      return;
    }

    console.error('❌ Error inesperado en WebhookController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
