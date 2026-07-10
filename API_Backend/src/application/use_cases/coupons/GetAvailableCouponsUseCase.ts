import { ICouponRepository } from '../../interfaces/ICouponRepository';

/**
 * DTO público de un cupón vigente (Fase 44, REQ-FE-21).
 * NO expone `currentUses`/`maxUses` en bruto (inteligencia comercial);
 * el frontend solo necesita lo visual: código, descuento y expiración
 * para la cuenta regresiva FOMO.
 */
export interface AvailableCouponDTO {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount: number | null;
  expiresAt: Date;
}

/**
 * Caso de Uso: Cupones promocionales VIGENTES para el storefront.
 *
 * Un cupón es vigente si: está activo, no ha expirado y aún tiene usos
 * disponibles. Reutiliza `findAllCoupons()` del repositorio (CMS) y filtra
 * en memoria — el catálogo de cupones es pequeño por naturaleza.
 */
export class GetAvailableCouponsUseCase {
  constructor(private readonly couponRepository: ICouponRepository) {}

  async execute(): Promise<AvailableCouponDTO[]> {
    const all = await this.couponRepository.findAllCoupons();
    const now = Date.now();

    return all
      .filter((c) => c.isActive && c.expiresAt.getTime() > now && c.currentUses < c.maxUses)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()) // el que expira antes primero (FOMO)
      .map((c) => ({
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPurchaseAmount: c.minPurchaseAmount,
        expiresAt: c.expiresAt,
      }));
  }
}
