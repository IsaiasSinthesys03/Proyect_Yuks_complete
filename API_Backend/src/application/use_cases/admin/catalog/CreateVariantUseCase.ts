import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { CreateVariantDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { ProductVariant } from '../../../../domain/entities/ProductVariant';
import {
  ProductNotFoundAdminError,
  DuplicateSkuError,
} from '../../../../domain/errors/ProductAdminErrors';

export class CreateVariantUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(dto: CreateVariantDTO, context: AdminAuditContext): Promise<ProductVariant> {
    const product = await this.repo.findById(dto.productId);
    if (!product) throw new ProductNotFoundAdminError(dto.productId);

    try {
      return await this.repo.createVariant(
        {
          productId: dto.productId,
          sku: dto.sku,
          size: dto.size ?? null,
          color: dto.color ?? null,
          stock: dto.stock,
        },
        context
      );
    } catch (err: any) {
      // Código PostgreSQL 23505 = unique_violation (SKU duplicado)
      if (err?.code === '23505') throw new DuplicateSkuError(dto.sku);
      throw err;
    }
  }
}
