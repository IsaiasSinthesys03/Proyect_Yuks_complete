// ==========================================
// Fase 24 — Errores de transición del Kanban de Pedidos
// ==========================================

/**
 * 422 — Transición de estado inválida.
 *
 * La máquina de estados del pedido es estricta:
 *   PAID → PREPARING → SHIPPED → DELIVERING → DELIVERED
 *   PAID | PREPARING → CANCELLED
 *
 * Cualquier salto, retroceso o transición desde un estado terminal
 * (DELIVERED, CANCELLED, NEEDS_RECONCILIATION, PAYMENT_PENDING) lanza
 * este error. HTTP 422 indica que la semántica de la petición es
 * incorrecta, no la sintaxis — el servidor entendió la petición pero
 * rechaza ejecutarla por violación de regla de negocio.
 */
export class InvalidStatusTransitionError extends Error {
  readonly statusCode = 422;
  constructor(
    orderId: string,
    currentStatus: string,
    requestedStatus: string,
  ) {
    super(
      `Transición de estado inválida para el pedido '${orderId}': ` +
      `'${currentStatus}' → '${requestedStatus}' no está permitida. ` +
      'Consulta el flujo válido: PAID→PREPARING→SHIPPED→DELIVERING→DELIVERED ' +
      '(PAID|PREPARING pueden cancelarse).'
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

/** 404 — Pedido no encontrado en contexto admin. */
export class OrderNotFoundAdminError extends Error {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`El pedido con id='${id}' no existe.`);
    this.name = 'OrderNotFoundAdminError';
  }
}
