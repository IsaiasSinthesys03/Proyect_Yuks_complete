import { OrderStatus } from '../entities/Order';

/**
 * Data Transfer Objects para el Motor de Checkout (REQ-BE-01).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * del ProcessCheckoutUseCase. No contienen lógica de negocio.
 */

/**
 * Payload de entrada para procesar un checkout.
 *
 * - items: Array de variantes y cantidades (precios se obtienen de la BD, NO del frontend).
 * - addressId: UUID de la dirección de envío seleccionada por el usuario.
 * - couponCode: Código de cupón opcional (case-insensitive).
 * - walletAmount: Monto a deducir del monedero (máximo = balance disponible).
 * - termsVersion: Versión exacta de las políticas aceptadas (compliance, REQ-BE-08).
 */
export interface CheckoutRequestDTO {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  addressId: string;
  couponCode?: string;
  walletAmount?: number;
  termsVersion: string;
}

/**
 * Respuesta del checkout exitoso.
 *
 * - stripeClientSecret: Solo presente cuando totalPaid > 0 (se necesita cobro en pasarela).
 *   Si totalPaid = 0 (todo pagado con monedero), se omite y el status ya es 'PAID'.
 */
export interface CheckoutResponseDTO {
  orderId: string;
  status: OrderStatus;
  totalPaid: number;
  stripeClientSecret?: string;
}
