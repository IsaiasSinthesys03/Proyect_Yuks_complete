/**
 * Entidad de Dominio: Coupon
 *
 * Representa un cupón de descuento del sistema (CMS-FE-15, REQ-FE-21).
 *
 * Tipos de descuento:
 *   - PERCENTAGE: Descuento porcentual (ej. 15% sobre el subtotal).
 *   - FIXED_AMOUNT: Descuento de monto fijo en MXN (ej. $100 de descuento).
 *
 * Reglas de negocio:
 *   - Los cupones tienen un límite global de usos (maxUses).
 *   - Pueden desactivarse sin destruir el registro histórico (isActive toggle).
 *   - Pueden tener un monto mínimo de carrito (minPurchaseAmount).
 *   - La búsqueda por código es case-insensitive (ej. "VERANO26" = "verano26").
 *
 * Esta interfaz es PURA — no depende de ningún framework, ORM ni base de datos.
 */
export interface Coupon {
  readonly id: string;
  readonly code: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly maxUses: number;
  readonly currentUses: number;
  readonly expiresAt: Date;
  readonly isActive: boolean;
  readonly minPurchaseAmount: number | null;
  readonly createdAt: Date;
}

/**
 * Tipos de descuento soportados.
 *
 * PERCENTAGE: Aplica un porcentaje al subtotal (ej. discountValue=15 → 15% off).
 * FIXED_AMOUNT: Aplica un monto fijo en MXN (ej. discountValue=100 → $100 off).
 */
export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
