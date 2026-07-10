import { ICouponRepository } from '../../interfaces/ICouponRepository';
import { RedeemCouponRequestDTO, RedeemCouponResponseDTO } from '../../../domain/types/CouponDTOs';
import {
  CouponNotFoundError,
  CouponExpiredError,
  CouponExhaustedError,
  CouponInactiveError,
  CouponMinNotMetError,
} from '../../../domain/errors/CouponErrors';

/**
 * Caso de Uso: Canjear/Validar un Cupón (CMS-FE-15, REQ-FE-21).
 *
 * Valida el cupón y calcula el descuento, pero NO incrementa el contador
 * de usos en BD — eso solo ocurre dentro del Checkout transaccional al
 * confirmar el pago (Fase 16).
 */
export class RedeemCouponUseCase {
  constructor(private readonly couponRepository: ICouponRepository) {}

  async execute(data: RedeemCouponRequestDTO): Promise<RedeemCouponResponseDTO> {
    const coupon = await this.couponRepository.findByCode(data.code);

    if (!coupon) {
      throw new CouponNotFoundError(data.code);
    }

    if (!coupon.isActive) {
      throw new CouponInactiveError(data.code);
    }

    if (coupon.expiresAt.getTime() < Date.now()) {
      throw new CouponExpiredError(data.code);
    }

    if (coupon.currentUses >= coupon.maxUses) {
      throw new CouponExhaustedError(data.code);
    }

    if (coupon.minPurchaseAmount !== null && data.cartSubtotal < coupon.minPurchaseAmount) {
      throw new CouponMinNotMetError(data.code, data.cartSubtotal, coupon.minPurchaseAmount);
    }

    const finalDiscount =
      coupon.discountType === 'PERCENTAGE'
        ? data.cartSubtotal * (coupon.discountValue / 100)
        : Math.min(coupon.discountValue, data.cartSubtotal);

    return {
      couponId: coupon.id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      finalDiscount,
    };
  }
}
