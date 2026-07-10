/**
 * Entidad de Dominio: RewardCode
 *
 * Representa un código UUID de recompensa virtual del Game Bridge (REQ-BE-05, REQ-FE-22).
 *
 * Reglas de negocio críticas:
 *   - Resolución #6: Los códigos NO caducan temporalmente. Pueden guardarse
 *     y regalarse meses después. La "Garbage Collection" solo ocurre por
 *     cancelación del pedido (→ REVOKED).
 *   - Resolución #7: Generación Unitaria (1 a 1). Si el cliente compra 5 peluches
 *     idénticos con recompensa virtual, se generan 5 códigos UUID separados,
 *     cada uno vinculado a su order_item individual.
 *   - Anti-fraude (Cancelación, Resolución #6): Si el código ya fue canjeado
 *     ('CLAIMED') en el juego, el backend bloquea la cancelación automática
 *     del pedido asociado.
 *
 * Ciclo de vida: AVAILABLE → CLAIMED (canjeado in-game)
 *                AVAILABLE → REVOKED (cancelación del pedido)
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface RewardCode {
  readonly id: string;
  readonly orderId: string;
  readonly orderItemId: string;
  readonly code: string;
  readonly status: RewardCodeStatus;
  readonly claimedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

/**
 * Ciclo de vida de un código de recompensa.
 *
 * AVAILABLE: Generado y listo para ser canjeado en el juego.
 * CLAIMED: Canjeado exitosamente en el juego vía API M2M.
 * REVOKED: Revocado por cancelación del pedido (solo si no fue CLAIMED).
 */
export type RewardCodeStatus = 'AVAILABLE' | 'CLAIMED' | 'REVOKED';
