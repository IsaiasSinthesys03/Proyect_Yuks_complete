import { ICouponRepository } from '../../../interfaces/ICouponRepository';
import { Coupon } from '../../../../domain/entities/Coupon';
import { CouponNotFoundAdminError } from '../../../../domain/errors/CouponAdminErrors';

export class ToggleCouponUseCase {
  constructor(private readonly couponRepo: ICouponRepository) {}

  async execute(id: string): Promise<Coupon> {
    const updated = await this.couponRepo.toggleActive(id);
    if (!updated) throw new CouponNotFoundAdminError(id);
    return updated;
  }
}
