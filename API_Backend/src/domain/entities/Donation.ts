/**
 * Entidad de Dominio: Donation (REQ-BE-09)
 *
 * Representa una donación voluntaria al proyecto Animayuks.
 * Completamente independiente del flujo de órdenes — no tiene inventario,
 * no tiene envío, no afecta stock ni monedero.
 *
 * El donor_email puede ser cualquier correo, no necesariamente de un usuario
 * registrado (las donaciones son públicas/anónimas opcionales).
 */
export interface Donation {
  readonly id: string;
  readonly userId: string | null;
  readonly stripePaymentIntentId: string | null;
  readonly stripeChargeId: string | null;
  readonly amount: number;
  readonly donorEmail: string;
  readonly status: DonationStatus;
  readonly idempotencyKey: string;
  readonly createdAt: Date;
}

/** Pipeline de estatus de una donación */
export type DonationStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED';
