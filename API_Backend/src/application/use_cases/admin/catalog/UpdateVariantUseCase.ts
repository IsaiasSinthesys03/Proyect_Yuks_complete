import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { UpdateVariantDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductVariant } from '../../../../domain/entities/ProductVariant';
import {
  VariantNotFoundError,
  DuplicateSkuError,
} from '../../../../domain/errors/ProductAdminErrors';

export class UpdateVariantUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(id: string, dto: UpdateVariantDTO, context: AdminAuditContext): Promise<ProductVariant> {
    try {
      const updated = await this.repo.updateVariant(id, dto, context);
      if (!updated) throw new VariantNotFoundError(id);
      return updated;
    } catch (err: any) {
      if (err instanceof VariantNotFoundError) throw err;
      if (err?.code === '23505') throw new DuplicateSkuError(dto.sku ?? '');
      throw err;
    }
  }
}
