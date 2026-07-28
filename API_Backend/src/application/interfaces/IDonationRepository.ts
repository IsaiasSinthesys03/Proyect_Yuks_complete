import { Donation, DonationStatus } from '../../domain/entities/Donation';
import {
  AdminDonationFilterDTO,
  DonationPaginatedResponseDTO,
  MyDonationsPaginatedResponseDTO,
} from '../../domain/types/DonationDTOs';

/**
 * Puerto (Interfaz) del Repositorio de Donaciones (REQ-BE-09).
 *
 * Vive en la capa de Application — los Use Cases dependen de esta
 * abstracción, no de la implementación Kysely/PostgreSQL concreta.
 */
export interface IDonationRepository {
  /** Crea una donación en estado PENDING */
  create(data: {
    stripePaymentIntentId: string;
    amount: number;
    donorEmail: string;
    idempotencyKey: string;
    userId?: string;
  }): Promise<Donation>;

  /** Busca por clave de idempotencia (anti-doble cobro) */
  findByIdempotencyKey(key: string): Promise<Donation | null>;

  /** Busca por Stripe Payment Intent ID (para el webhook) */
  findByStripePaymentIntentId(paymentIntentId: string): Promise<Donation | null>;

  /** Actualiza el estado y opcionalmente el charge ID */
  updateStatus(
    donationId: string,
    status: DonationStatus,
    stripeChargeId?: string
  ): Promise<Donation>;

  /** Listado paginado para el panel CMS (CMS-FE-13) */
  findAll(filter: AdminDonationFilterDTO): Promise<DonationPaginatedResponseDTO>;

  findByUserId(userId: string, page?: number, limit?: number): Promise<MyDonationsPaginatedResponseDTO>;
}
