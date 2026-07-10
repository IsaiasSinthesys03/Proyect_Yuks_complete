import { IDonationRepository } from '../../interfaces/IDonationRepository';
import { IPaymentGateway } from '../../interfaces/IPaymentGateway';
import { Donation } from '../../../domain/entities/Donation';
import { DonationNotFoundError } from '../../../domain/errors/DonationErrors';

/**
 * Use Case: Confirmar Donación vía Webhook de Stripe (REQ-BE-09)
 *
 * Se ejecuta cuando Stripe envía `payment_intent.succeeded` para una donación.
 *
 * Flujo:
 *   1. Parsear y verificar la firma HMAC del webhook (delega al IPaymentGateway).
 *   2. Filtrar únicamente eventos de tipo `payment_intent.succeeded`.
 *   3. Verificar que el metadata del PaymentIntent identifica este pago como DONATION.
 *   4. Buscar la donación por Stripe Payment Intent ID.
 *   5. Si ya está COMPLETED, responder OK (idempotencia del webhook — Stripe reintenta).
 *   6. Actualizar status a COMPLETED con el charge ID.
 *
 * Nota: el envío de email de recibo se implementará en Fase 28 (EmailService).
 * Por ahora el webhook confirma la donación pero no envía email.
 */
export class ConfirmDonationWebhookUseCase {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(rawBody: Buffer, signature: string): Promise<{ confirmed: boolean; donationId?: string }> {
    // Paso 1: Verificar firma HMAC y parsear evento
    const event = this.paymentGateway.parseWebhookEvent(rawBody, signature);

    // Paso 2: Solo procesar pagos exitosos
    if (event.type !== 'PAYMENT_SUCCESS') {
      return { confirmed: false };
    }

    // Paso 3: Filtrar por metadata type === DONATION
    if (event.metadata?.type !== 'DONATION') {
      return { confirmed: false };
    }

    const paymentIntentId = event.providerOrderId;

    // Paso 4: Buscar la donación en BD
    const donation = await this.donationRepository.findByStripePaymentIntentId(paymentIntentId);
    if (!donation) {
      throw new DonationNotFoundError(paymentIntentId);
    }

    // Paso 5: Idempotencia del webhook (Stripe reintenta en caso de timeout)
    if (donation.status === 'COMPLETED') {
      return { confirmed: true, donationId: donation.id };
    }

    // Paso 6: Confirmar donación
    const updated = await this.donationRepository.updateStatus(
      donation.id,
      'COMPLETED',
      event.chargeId
    );

    return { confirmed: true, donationId: updated.id };
  }
}
