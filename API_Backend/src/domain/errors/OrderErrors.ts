/**
 * Errores de Dominio: Módulo de Pedidos (REQ-FE-23).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando el pedido no existe o no pertenece al usuario autenticado.
 * HTTP 404 Not Found.
 */
export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`El pedido "${orderId}" no fue encontrado o no pertenece a este usuario.`);
    this.name = 'OrderNotFoundError';
  }
}

/**
 * Se lanza cuando se intenta cancelar un pedido cuyo status ≠ 'PAID'.
 * REQ-FE-23: Solo se permite cancelación autónoma en status "Pago Confirmado".
 * En PREPARING o después, el botón desaparece del frontend.
 * HTTP 422 Unprocessable Entity.
 */
export class OrderNotCancellableError extends Error {
  constructor(orderId: string, currentStatus: string) {
    super(`El pedido "${orderId}" no puede cancelarse en estado "${currentStatus}". Solo se permite la cancelación en estado "PAID".`);
    this.name = 'OrderNotCancellableError';
  }
}

/**
 * Se lanza cuando se intenta cancelar un pedido cuyo código de recompensa
 * ya fue canjeado en el juego (Resolución #6 anti-fraude).
 * HTTP 422 Unprocessable Entity.
 */
export class RewardAlreadyClaimedError extends Error {
  constructor(orderId: string) {
    super(`No puedes cancelar el pedido "${orderId}" porque ya reclamaste la recompensa virtual. Contacta a soporte.`);
    this.name = 'RewardAlreadyClaimedError';
  }
}
