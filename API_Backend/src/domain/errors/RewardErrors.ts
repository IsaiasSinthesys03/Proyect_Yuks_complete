/**
 * Errores de Dominio: Módulo de Recompensas / Game Bridge (REQ-BE-05).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando el UUID del código de recompensa no existe en la BD SQL.
 * HTTP 404 Not Found.
 */
export class RewardCodeNotFoundError extends Error {
  constructor(code: string) {
    super(`El código de recompensa "${code}" no existe en el sistema.`);
    this.name = 'RewardCodeNotFoundError';
  }
}

/**
 * Se lanza cuando se intenta validar/canjear un código que ya fue canjeado previamente.
 * HTTP 409 Conflict.
 */
export class RewardCodeAlreadyClaimedError extends Error {
  constructor(code: string) {
    super(`El código de recompensa "${code}" ya fue canjeado previamente.`);
    this.name = 'RewardCodeAlreadyClaimedError';
  }
}

/**
 * Se lanza cuando se intenta validar/canjear un código que fue revocado
 * por cancelación del pedido (Resolución #6).
 * HTTP 410 Gone.
 */
export class RewardRevokedError extends Error {
  constructor(code: string) {
    super(`El código de recompensa "${code}" fue revocado por cancelación del pedido asociado.`);
    this.name = 'RewardRevokedError';
  }
}
