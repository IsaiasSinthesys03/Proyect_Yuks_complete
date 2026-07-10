/**
 * Data Transfer Objects para el Puerto de Pasarela de Pago (REQ-BE-02).
 *
 * `WebhookEventDTO` es la frontera de traducción entre el lenguaje específico
 * del proveedor (Stripe, MercadoPago, etc.) y el lenguaje neutral que entiende
 * la capa de Application. Ningún Use Case debe conocer la forma de un evento
 * de Stripe — solo conoce estos 3 tipos agnósticos.
 */
export type WebhookEventType = 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'UNHANDLED';

export interface WebhookEventDTO {
  type: WebhookEventType;
  /** ID del pago en el sistema del proveedor (ej. PaymentIntent ID de Stripe). */
  providerOrderId: string;
  /**
   * Metadatos asociados al PaymentIntent (ej. { type: 'DONATION', donorEmail: '...' }).
   * Poblado por la implementación concreta del adaptador (StripeAdapter).
   * Permite distinguir donaciones de pedidos en el mismo endpoint de webhook.
   */
  metadata?: Record<string, string>;
  /** ID del cargo exitoso en Stripe (charge ID). Disponible en PAYMENT_SUCCESS. */
  chargeId?: string;
}
