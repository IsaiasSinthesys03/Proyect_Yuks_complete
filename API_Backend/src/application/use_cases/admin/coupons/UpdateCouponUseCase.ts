import { ICouponRepository } from '../../../interfaces/ICouponRepository';
import { Coupon } from '../../../../domain/entities/Coupon';
import { UpdateCouponDTO } from '../../../../domain/types/AdminCouponDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import {
  InvalidDiscountValueError,
  InvalidExpirationDateError,
  DuplicateCouponCodeError,
  CouponNotFoundAdminError,
} from '../../../../domain/errors/CouponAdminErrors';

export class UpdateCouponUseCase {
  constructor(private readonly couponRepo: ICouponRepository) {}

  async execute(id: string, dto: UpdateCouponDTO, context: AdminAuditContext): Promise<Coupon> {
    // Validar discountValue si se envía junto con discountType
    // Para detectar el tipo final, usamos el existente si no se cambia
    if (dto.discountValue !== undefined || dto.discountType !== undefined) {
      // Necesitamos el tipo actual para validar el valor
      const existing = await this.couponRepo.findCouponById(id);
      if (!existing) throw new CouponNotFoundAdminError(id);

      const finalType = dto.discountType ?? existing.discountType;
      const finalValue = dto.discountValue ?? existing.discountValue;

      if (finalType === 'PERCENTAGE' && (finalValue <= 0 || finalValue > 100)) {
        throw new InvalidDiscountValueError(
          'PERCENTAGE debe estar entre 1 y 100 (inclusive).'
        );
      }
      if (finalType === 'FIXED_AMOUNT' && finalValue <= 0) {
        throw new InvalidDiscountValueError('FIXED_AMOUNT debe ser mayor que 0.');
      }
    }

    // Validar fecha de expiración si se envía
    const updatePayload: UpdateCouponDTO = { ...dto };
    if (dto.expiresAt !== undefined) {
      const expiresAt = new Date(dto.expiresAt);
      if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        throw new InvalidExpirationDateError();
      }
      updatePayload.expiresAt = expiresAt;
    }

    try {
      const updated = await this.couponRepo.updateCoupon(id, updatePayload, context);
      if (!updated) throw new CouponNotFoundAdminError(id);
      return updated;
    } catch (err: unknown) {
      if (err instanceof CouponNotFoundAdminError) throw err;
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        throw new DuplicateCouponCodeError(dto.code ?? '');
      }
      throw err;
    }
  }
}
