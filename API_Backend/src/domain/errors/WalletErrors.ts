/**
 * Errores de Dominio: Módulo de Monedero Virtual (REQ-FE-20, Q8).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando wallet.balance < walletDeduction.
 * Q8: El constraint SQL `CHECK (balance >= 0)` es la red de seguridad final.
 * HTTP 422 Unprocessable Entity.
 */
export class InsufficientFundsError extends Error {
  constructor(requested: number, available: number) {
    super(`Saldo insuficiente en el monedero: solicitado $${requested.toFixed(2)}, disponible $${available.toFixed(2)}.`);
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Se lanza cuando wallet.expiresAt < NOW() al intentar usar saldo.
 * HTTP 422 Unprocessable Entity.
 */
export class WalletExpiredError extends Error {
  constructor(expiresAt: Date) {
    super(`El saldo del monedero expiró el ${expiresAt.toISOString()}. No se puede utilizar para esta compra.`);
    this.name = 'WalletExpiredError';
  }
}
