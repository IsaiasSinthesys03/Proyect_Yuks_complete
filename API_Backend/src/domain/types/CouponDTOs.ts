import { CouponDiscountType } from '../entities/Coupon';

/**
 * Data Transfer Objects para el módulo de Cupones (CMS-FE-15, REQ-FE-21).
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases de cupones. No contienen lógica de negocio.
 */

/**
 * Payload de entrada para canjear un cupón.
 *
 * - code: Código del cupón ingresado por el usuario (ej. "VERANO26").
 * - cartSubtotal: Subtotal actual del carrito ANTES de aplicar descuento.
 *   Se usa para validar el monto mínimo del cupón (Resolución #3).
 */
export interface RedeemCouponRequestDTO {
  code: string;
  cartSubtotal: number;
}

/**
 * Respuesta del canje exitoso del cupón.
 *
 * - finalDiscount: El monto REAL a descontar del subtotal.
 *   Para PERCENTAGE: cartSubtotal * (discountValue / 100).
 *   Para FIXED_AMOUNT: min(discountValue, cartSubtotal).
 *   No se incrementan los usos aquí — eso ocurre en el checkout.
 */
export interface RedeemCouponResponseDTO {
  couponId: string;
  discountType: CouponDiscountType;
  discountValue: number;
  finalDiscount: number;
}
