import { WalletTransaction } from '../entities/WalletTransaction';
import { PaginatedResponseDTO } from './ProductDTOs';

/**
 * Data Transfer Objects para el módulo de Monedero Virtual (REQ-FE-20).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases del monedero. No contienen lógica de negocio.
 */

/**
 * Resumen del saldo actual del monedero.
 * Incluye la fecha de caducidad global (Resolución #4).
 */
export interface WalletSummaryDTO {
  balance: number;
  expiresAt: Date | null;
}

/**
 * Historial de transacciones del monedero (ledger) con paginación.
 * Reutiliza PaginatedResponseDTO para consistencia con el sistema existente.
 */
export type WalletLedgerDTO = PaginatedResponseDTO<WalletTransaction>;
