/**
 * Errores de Dominio: Motor de Checkout (REQ-BE-01).
 *
 * Cada clase extiende de Error nativo de JavaScript.
 * Los controladores HTTP (capa de infraestructura) traducirán
 * estos errores a códigos de estado HTTP apropiados.
 */

/**
 * Se lanza cuando la `X-Idempotency-Key` ya fue procesada (Q2: TTL 24h en Redis).
 * HTTP 409 Conflict.
 */
export class IdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`La operación con idempotency key "${key}" ya fue procesada.`);
    this.name = 'IdempotencyConflictError';
  }
}

/**
 * Se lanza cuando el bloqueo pesimista de stock en Redis no se puede adquirir.
 * Otro usuario ya reservó la misma variante (REQ-BE-01: lock 10 min).
 * HTTP 409 Conflict.
 */
export class StockLockFailedError extends Error {
  constructor(variantId: string) {
    super(`No se pudo reservar stock para la variante "${variantId}". Otro usuario la está procesando.`);
    this.name = 'StockLockFailedError';
  }
}

/**
 * Se lanza cuando variant.stock < requested quantity al momento del commit SQL.
 * HTTP 409 Conflict.
 */
export class OutOfStockError extends Error {
  constructor(variantSku: string, requested: number, available: number) {
    super(`Stock insuficiente para "${variantSku}": solicitado ${requested}, disponible ${available}.`);
    this.name = 'OutOfStockError';
  }
}

/**
 * Se lanza cuando totalAfterDiscount < minPurchaseAmount.
 * (Resolución #3: evaluar post-cupón, pre-monedero).
 * HTTP 422 Unprocessable Entity.
 */
export class MinPurchaseNotMetError extends Error {
  constructor(totalAfterDiscount: number, minRequired: number) {
    super(`El total después del descuento ($${totalAfterDiscount.toFixed(2)}) no alcanza el mínimo de compra ($${minRequired.toFixed(2)}).`);
    this.name = 'MinPurchaseNotMetError';
  }
}

/**
 * Se lanza cuando la pasarela de pago rechaza la transacción.
 * HTTP 402 Payment Required.
 */
export class PaymentFailedError extends Error {
  constructor(reason: string) {
    super(`El pago fue rechazado por la pasarela: ${reason}`);
    this.name = 'PaymentFailedError';
  }
}

/**
 * Se lanza cuando el webhook recibe un pago tardío (3D Secure)
 * pero el stock ya fue agotado por otro cliente (Resolución #1: auto-refund).
 * El sistema ejecuta un reembolso total automático.
 * HTTP 200 (se procesa internamente, no se retorna al usuario).
 */
export class StockExpiredAfter3DSecureError extends Error {
  constructor(orderId: string) {
    super(`El pedido "${orderId}" fue aprobado por el banco, pero el stock se agotó durante la autorización 3D Secure. Reembolso automático ejecutado.`);
    this.name = 'StockExpiredAfter3DSecureError';
  }
}

/**
 * Se lanza cuando la dirección de envío no existe o no pertenece al usuario.
 * HTTP 404 Not Found.
 */
export class AddressNotFoundError extends Error {
  constructor(addressId: string) {
    super(`La dirección "${addressId}" no fue encontrada o no pertenece a este usuario.`);
    this.name = 'AddressNotFoundError';
  }
}

export class ShippingDestinationUnavailableError extends Error {
  constructor(message: string, public readonly reason: 'CONTINENT' | 'COUNTRY' | 'REGION') {
    super(message);
    this.name = 'ShippingDestinationUnavailableError';
  }
}

export class InvalidShippingAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidShippingAddressError';
  }
}

/**
 * Se lanza cuando la firma HMAC del webhook de la pasarela no es válida (REQ-BE-02).
 * Protege contra webhooks falsificados que no provienen realmente de Stripe.
 * HTTP 400 Bad Request.
 */
export class WebhookSignatureInvalidError extends Error {
  constructor() {
    super('La firma del webhook no pudo ser verificada. Posible solicitud falsificada.');
    this.name = 'WebhookSignatureInvalidError';
  }
}
