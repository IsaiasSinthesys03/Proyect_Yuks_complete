/**
 * Puerto (Interfaz) de la Pasarela de Pago.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la implementación concreta (Stripe, MercadoPago, etc.) debe cumplir.
 * Los Use Cases dependen de esta abstracción — no de Stripe SDK directamente.
 *
 * Esto permite cambiar de pasarela de pago sin modificar la lógica de negocio.
 */
import { WebhookEventDTO } from '../../domain/types/PaymentDTOs';

export interface IPaymentGateway {
  /**
   * Crea un intento de pago en la pasarela.
   *
   * @param amount - Monto en la unidad mayor de la moneda (ej. pesos MXN, no centavos).
   *                 La implementación concreta se encarga de convertir a centavos si es necesario.
   * @param currency - Código ISO 4217 de la moneda (ej. 'mxn').
   * @param metadata - Datos adicionales para asociar con el pago (ej. orderId, userId).
   * @returns El clientSecret para completar el pago en el frontend y el ID del intent.
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }>;

  /**
   * Ejecuta un reembolso total o parcial.
   *
   * Resolución #1: Usado para auto-refund cuando el pago 3D Secure llega tarde
   * y el stock ya fue agotado por otro cliente.
   *
   * @param paymentIntentId - ID del intent de pago original.
   * @param amount - Monto a reembolsar. Si no se proporciona, reembolso total.
   * @returns El ID del reembolso generado por la pasarela.
   */
  refund(
    paymentIntentId: string,
    amount?: number
  ): Promise<{
    refundId: string;
  }>;

  /**
   * Verifica la firma HMAC del webhook (REQ-BE-02) Y traduce el evento
   * específico del proveedor a un DTO neutral.
   *
   * INVERSIÓN DE CONTROL: La capa de Application JAMÁS debe parsear la forma
   * de un evento de Stripe/MercadoPago. Ese conocimiento vive exclusivamente
   * en la implementación concreta (ej. `StripeAdapter`), que devuelve un
   * `WebhookEventDTO` agnóstico al proveedor.
   *
   * @param payload - Cuerpo raw del request (Buffer, no JSON parseado).
   * @param signature - Valor del header de firma (ej. Stripe-Signature).
   * @throws Error de dominio si la firma es inválida (ej. `WebhookSignatureInvalidError`).
   */
  parseWebhookEvent(payload: Buffer, signature: string): WebhookEventDTO;
}
