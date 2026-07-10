// ==========================================
// Fase 25 — Errores de Reembolsos Administrativos
// ==========================================

/**
 * 401 — La contraseña de re-autenticación no coincide.
 *
 * Se usa `401 Unauthorized` (no 403) porque la identidad del admin
 * no pudo ser re-confirmada. El token JWT pudo ser válido, pero la
 * segunda capa de autenticación falló.
 *
 * INVARIANTE CRÍTICA: Stripe NUNCA debe ser invocado si este error se lanza.
 */
export class ReauthFailedError extends Error {
  readonly statusCode = 401;
  constructor() {
    super('Contraseña incorrecta. Re-autenticación fallida. El reembolso no fue procesado.');
    this.name = 'ReauthFailedError';
  }
}

/**
 * 422 — El monto solicitado excede el total pagado originalmente.
 *
 * Stripe rechazaría el reembolso de todas formas, pero validamos
 * ANTES de llegar al gateway para no consumir una llamada de API
 * innecesaria y dar un mensaje de error claro en español.
 */
export class RefundAmountExceedsTotalError extends Error {
  readonly statusCode = 422;
  constructor(requested: number, totalPaid: number) {
    super(
      `El monto solicitado ($${requested}) excede el total pagado originalmente ($${totalPaid}). ` +
      'El reembolso no fue procesado.'
    );
    this.name = 'RefundAmountExceedsTotalError';
  }
}

/**
 * 422 — El pedido no es reembolsable en su estado actual.
 *
 * Causas posibles:
 *   - `stripePaymentIntentId` es null (pedido creado en dev/test sin pago real).
 *   - El pedido está en PAYMENT_PENDING (nunca fue cobrado).
 */
export class OrderNotRefundableError extends Error {
  readonly statusCode = 422;
  constructor(reason: string) {
    super(`El pedido no puede ser reembolsado: ${reason}`);
    this.name = 'OrderNotRefundableError';
  }
}

/**
 * 502 — El gateway de pagos rechazó o falló el reembolso.
 *
 * Distinct from internal errors (500): the system worked, but Stripe said no.
 * El admin debe revisar el dashboard de Stripe para más detalles.
 */
export class RefundGatewayError extends Error {
  readonly statusCode = 502;
  constructor(originalMessage: string) {
    super(`El gateway de pagos rechazó el reembolso: ${originalMessage}`);
    this.name = 'RefundGatewayError';
  }
}
