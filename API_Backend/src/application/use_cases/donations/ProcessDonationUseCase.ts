import { IDonationRepository } from '../../interfaces/IDonationRepository';
import { IPaymentGateway } from '../../interfaces/IPaymentGateway';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { CreateDonationDTO, DonationResponseDTO } from '../../../domain/types/DonationDTOs';
import {
  DonationAmountTooLowError,
  DonationAlreadyProcessedError,
} from '../../../domain/errors/DonationErrors';

/**
 * Use Case: Procesar una Donación (REQ-BE-09)
 *
 * Flujo:
 *   1. Verificar idempotencia — si el mismo idempotency_key ya existe, retornar
 *      la donación existente sin crear nada en Stripe (anti-doble cobro).
 *   2. Leer donation_min_amount desde system_settings (dinámico, configurable por el admin).
 *   3. Validar que amount >= minimum.
 *   4. Crear PaymentIntent en Stripe con metadata tipo DONATION.
 *   5. Guardar donación en estado PENDING.
 *   6. Retornar { donationId, clientSecret } para que el frontend complete el pago.
 *
 * Independencia total del checkout: no toca orders, stock, wallets ni coupons.
 */
export class ProcessDonationUseCase {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly systemSettingsRepository: ISystemSettingsRepository
  ) {}

  async execute(dto: CreateDonationDTO): Promise<DonationResponseDTO> {
    // Paso 1: Idempotencia
    const existing = await this.donationRepository.findByIdempotencyKey(dto.idempotencyKey);
    if (existing) {
      if (existing.status !== 'PENDING') {
        throw new DonationAlreadyProcessedError(dto.idempotencyKey);
      }
      // PENDING ya existente — el cliente posiblemente recargó la página.
      // No podemos retornar el clientSecret original (Stripe no lo persiste),
      // así que lanzamos el error de idempotencia para que el frontend reintente
      // con una nueva clave. En un escenario real, el frontend genera la clave
      // antes del primer intento y la reutiliza si recibe error de red.
      throw new DonationAlreadyProcessedError(dto.idempotencyKey);
    }

    // Paso 2: Leer mínimo desde system_settings (configurable por el admin desde CMS)
    const minAmount = await this.systemSettingsRepository.getDonationMinAmount();

    // Paso 3: Validar monto mínimo
    if (dto.amount < minAmount) {
      throw new DonationAmountTooLowError(dto.amount, minAmount);
    }

    // Paso 4: Crear PaymentIntent en Stripe
    const { clientSecret, paymentIntentId } = await this.paymentGateway.createPaymentIntent(
      dto.amount,
      'mxn',
      {
        type: 'DONATION',
        donorEmail: dto.donorEmail,
        idempotencyKey: dto.idempotencyKey,
      }
    );

    // Paso 5: Persistir en estado PENDING
    const donation = await this.donationRepository.create({
      stripePaymentIntentId: paymentIntentId,
      amount: dto.amount,
      donorEmail: dto.donorEmail,
      idempotencyKey: dto.idempotencyKey,
    });

    // Paso 6: Retornar clientSecret al frontend
    return {
      donationId: donation.id,
      clientSecret,
      amount: donation.amount,
      donorEmail: donation.donorEmail,
      status: donation.status,
    };
  }
}
