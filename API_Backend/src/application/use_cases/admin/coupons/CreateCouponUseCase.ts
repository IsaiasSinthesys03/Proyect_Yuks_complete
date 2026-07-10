import { ICouponRepository } from '../../../interfaces/ICouponRepository';
import { Coupon } from '../../../../domain/entities/Coupon';
import { CreateCouponDTO } from '../../../../domain/types/AdminCouponDTOs';
import {
  InvalidDiscountValueError,
  InvalidExpirationDateError,
  DuplicateCouponCodeError,
} from '../../../../domain/errors/CouponAdminErrors';

export class CreateCouponUseCase {
  constructor(private readonly couponRepo: ICouponRepository) {}

  async execute(dto: CreateCouponDTO): Promise<Coupon> {
    // Validar valor de descuento según tipo
    if (dto.discountType === 'PERCENTAGE') {
      if (dto.discountValue <= 0 || dto.discountValue > 100) {
        throw new InvalidDiscountValueError(
          'PERCENTAGE debe estar entre 1 y 100 (inclusive).'
        );
      }
    } else {
      if (dto.discountValue <= 0) {
        throw new InvalidDiscountValueError(
          'FIXED_AMOUNT debe ser mayor que 0.'
        );
      }
    }

    // Validar fecha de expiración
    const expiresAt = new Date(dto.expiresAt);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new InvalidExpirationDateError();
    }

    try {
      return await this.couponRepo.createCoupon({ ...dto, expiresAt });
    } catch (err: unknown) {
      // Detectar violación UNIQUE del código (PostgreSQL error code 23505)
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
        throw new DuplicateCouponCodeError(dto.code);
      }
      throw err;
    }
  }
}
