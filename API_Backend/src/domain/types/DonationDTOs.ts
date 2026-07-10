import { Donation, DonationStatus } from '../entities/Donation';
import { PaginatedResponseDTO } from './ProductDTOs';

/** DTO de entrada para iniciar una donación (POST /api/donate) */
export interface CreateDonationDTO {
  amount: number;
  donorEmail: string;
  idempotencyKey: string;
}

/** DTO de respuesta pública de donación */
export interface DonationResponseDTO {
  donationId: string;
  clientSecret: string;
  amount: number;
  donorEmail: string;
  status: DonationStatus;
}

/** DTO para listado admin de donaciones */
export interface AdminDonationSummaryDTO {
  id: string;
  amount: number;
  donorEmail: string;
  status: DonationStatus;
  stripePaymentIntentId: string | null;
  createdAt: Date;
}

/** Filtros para el listado admin de donaciones */
export interface AdminDonationFilterDTO {
  status?: DonationStatus;
  page?: number;
  limit?: number;
}

export type DonationPaginatedResponseDTO = PaginatedResponseDTO<AdminDonationSummaryDTO>;

/** Mapa la entidad al DTO de respuesta pública */
export function mapDonationToSummaryDTO(donation: Donation): AdminDonationSummaryDTO {
  return {
    id: donation.id,
    amount: donation.amount,
    donorEmail: donation.donorEmail,
    status: donation.status,
    stripePaymentIntentId: donation.stripePaymentIntentId,
    createdAt: donation.createdAt,
  };
}
