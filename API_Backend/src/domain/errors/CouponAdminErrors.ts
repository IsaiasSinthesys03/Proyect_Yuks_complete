// ==========================================
// Fase 24 — Errores del CMS de Cupones
// ==========================================

/** 400 — El valor de descuento es inválido según el tipo de cupón. */
export class InvalidDiscountValueError extends Error {
  readonly statusCode = 400;
  constructor(detail: string) {
    super(`Valor de descuento inválido: ${detail}`);
    this.name = 'InvalidDiscountValueError';
  }
}

/** 400 — La fecha de expiración es inválida o ya pasó. */
export class InvalidExpirationDateError extends Error {
  readonly statusCode = 400;
  constructor() {
    super('La fecha de expiración debe ser una fecha futura válida.');
    this.name = 'InvalidExpirationDateError';
  }
}

/** 409 — El código de cupón ya existe (constraint UNIQUE en la BD). */
export class DuplicateCouponCodeError extends Error {
  readonly statusCode = 409;
  constructor(code: string) {
    super(`El código de cupón '${code}' ya existe en el sistema.`);
    this.name = 'DuplicateCouponCodeError';
  }
}

/** 404 — Cupón no encontrado. */
export class CouponNotFoundAdminError extends Error {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`El cupón con id='${id}' no existe.`);
    this.name = 'CouponNotFoundAdminError';
  }
}
