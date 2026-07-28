import { ICouponRepository } from '../../../interfaces/ICouponRepository';
import { Coupon } from '../../../../domain/entities/Coupon';
import { CouponNotFoundAdminError } from '../../../../domain/errors/CouponAdminErrors';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';

export class ToggleCouponUseCase {
  constructor(private readonly couponRepo: ICouponRepository) {}

  async execute(id: string, context: AdminAuditContext): Promise<Coupon> {
    const updated = await this.couponRepo.toggleActive(id, context);
    if (!updated) throw new CouponNotFoundAdminError(id);
    return updated;
  }
}
