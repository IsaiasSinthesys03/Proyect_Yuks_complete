import { ICouponRepository } from '../../../interfaces/ICouponRepository';
import { Coupon } from '../../../../domain/entities/Coupon';
import { CouponNotFoundAdminError } from '../../../../domain/errors/CouponAdminErrors';

/** Casos de uso de LECTURA de cupones para el CMS (Fase 30, GET endpoints). */

export class ListCouponsUseCase {
  constructor(private readonly repo: ICouponRepository) {}
  execute(): Promise<Coupon[]> {
    return this.repo.findAllCoupons();
  }
}

export class GetCouponByIdUseCase {
  constructor(private readonly repo: ICouponRepository) {}
  async execute(id: string): Promise<Coupon> {
    const coupon = await this.repo.findCouponById(id);
    if (!coupon) throw new CouponNotFoundAdminError(id);
    return coupon;
  }
}
