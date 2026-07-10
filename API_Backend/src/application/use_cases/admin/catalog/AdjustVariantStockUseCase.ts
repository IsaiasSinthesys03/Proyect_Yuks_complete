import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { AdjustStockDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductVariant } from '../../../../domain/entities/ProductVariant';
import {
  VariantNotFoundError,
  InvalidStockDeltaError,
} from '../../../../domain/errors/ProductAdminErrors';

export class AdjustVariantStockUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(variantId: string, dto: AdjustStockDTO, context: AdminAuditContext): Promise<ProductVariant> {
    // Verificar existencia antes de intentar el ajuste atómico
    const variant = await this.repo.findVariantById(variantId);
    if (!variant) throw new VariantNotFoundError(variantId);

    const updated = await this.repo.adjustStockDelta(variantId, dto.delta, context);

    // null → la BD rechazó el ajuste porque stock + delta < 0
    if (updated === null) throw new InvalidStockDeltaError();

    return updated;
  }
}
