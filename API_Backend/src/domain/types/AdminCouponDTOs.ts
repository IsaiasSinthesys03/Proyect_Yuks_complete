import { CouponDiscountType } from '../entities/Coupon';

// ==========================================
// Fase 24 — DTOs para gestión admin de cupones
// ==========================================

export interface CreateCouponDTO {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxUses: number;
  expiresAt: string | Date;
  minPurchaseAmount?: number | null;
}

export interface UpdateCouponDTO {
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxUses?: number;
  expiresAt?: string | Date;
  minPurchaseAmount?: number | null;
}
