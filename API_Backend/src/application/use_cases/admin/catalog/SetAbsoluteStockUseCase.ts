import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductVariant } from '../../../../domain/entities/ProductVariant';
import {
  VariantNotFoundError,
  InvalidStockDeltaError,
} from '../../../../domain/errors/ProductAdminErrors';

export class SetAbsoluteStockUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(variantId: string, payload: { stock: number }, context: AdminAuditContext): Promise<ProductVariant> {
    if (payload.stock < 0 || !Number.isInteger(payload.stock)) {
      throw new InvalidStockDeltaError(); 
    }

    const updated = await this.repo.setAbsoluteStock(variantId, payload.stock, context);
    if (!updated) {
      throw new VariantNotFoundError(variantId);
    }
    
    return updated;
  }
}
