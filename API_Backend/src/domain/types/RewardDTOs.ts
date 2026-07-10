/**
 * Data Transfer Objects para el módulo de Recompensas / Game Bridge
 * (REQ-BE-05, REQ-FE-22).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases de recompensas. No contienen lógica de negocio.
 */

/**
 * DTO de salida para la Bóveda de Recompensas del usuario.
 *
 * Incluye el nombre del producto para contexto visual (ej. "Peluche Kira")
 * y la fecha de canje si ya fue usado in-game.
 */
export interface RewardCodeDTO {
  code: string;
  status: string;
  productName: string;
  claimedAt?: Date;
}

/**
 * Payload de entrada para la validación M2M de un código de recompensa.
 * Enviado por el servidor del videojuego (Q11: Auth Máquina a Máquina).
 */
export interface ValidateRewardRequestDTO {
  code: string;
}

/**
 * Respuesta de la validación M2M.
 *
 * - valid: true si el código fue marcado como CLAIMED exitosamente.
 * - reason: Solo presente cuando valid=false. Indica la causa del rechazo.
 * - rewardData: Solo presente cuando valid=true. Datos del producto para el juego.
 */
export interface ValidateRewardResponseDTO {
  valid: boolean;
  reason?: 'ALREADY_CLAIMED' | 'REVOKED' | 'NOT_FOUND';
  rewardData?: {
    productName: string;
    variantSku: string;
  };
}
