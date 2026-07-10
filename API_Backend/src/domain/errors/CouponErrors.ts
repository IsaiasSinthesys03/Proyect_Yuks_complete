/**
 * Errores de Dominio: Módulo de Cupones (CMS-FE-15, REQ-FE-21).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/** Se lanza cuando el código de cupón no existe en el sistema. HTTP 404. */
export class CouponNotFoundError extends Error {
  constructor(code: string) {
    super(`El cupón "${code}" no existe.`);
    this.name = 'CouponNotFoundError';
  }
}

/** Se lanza cuando expiresAt < NOW(). HTTP 410 Gone. */
export class CouponExpiredError extends Error {
  constructor(code: string) {
    super(`El cupón "${code}" ha expirado.`);
    this.name = 'CouponExpiredError';
  }
}

/** Se lanza cuando currentUses >= maxUses. HTTP 410 Gone. */
export class CouponExhaustedError extends Error {
  constructor(code: string) {
    super(`El cupón "${code}" ha alcanzado su límite máximo de usos.`);
    this.name = 'CouponExhaustedError';
  }
}

/** Se lanza cuando isActive === false. HTTP 410 Gone. */
export class CouponInactiveError extends Error {
  constructor(code: string) {
    super(`El cupón "${code}" está desactivado.`);
    this.name = 'CouponInactiveError';
  }
}

/**
 * Se lanza cuando el carrito no alcanza el monto mínimo del cupón.
 * HTTP 422 Unprocessable Entity.
 */
export class CouponMinNotMetError extends Error {
  constructor(code: string, cartSubtotal: number, minRequired: number) {
    super(`El cupón "${code}" requiere un mínimo de $${minRequired.toFixed(2)} en el carrito. Subtotal actual: $${cartSubtotal.toFixed(2)}.`);
    this.name = 'CouponMinNotMetError';
  }
}
