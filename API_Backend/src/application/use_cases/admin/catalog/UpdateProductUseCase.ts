import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { UpdateProductDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { Product } from '../../../../domain/entities/Product';
import {
  InvalidPriceError,
  CategoryNotFoundError,
  ProductNotFoundAdminError,
  OptimisticConcurrencyError,
} from '../../../../domain/errors/ProductAdminErrors';

export class UpdateProductUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO, context: AdminAuditContext): Promise<Product> {
    if (dto.price !== undefined && dto.price <= 0) throw new InvalidPriceError();

    if (dto.categoryIds !== undefined) {
      if (dto.categoryIds.length === 0) {
        throw new Error('At least one category is required');
      }
      for (const categoryId of dto.categoryIds) {
        const category = await this.repo.findCategoryById(categoryId);
        if (!category) throw new CategoryNotFoundError(categoryId);
      }
    }

    const { version, ...fields } = dto;

    const updated = await this.repo.update(id, fields, version, context);

    if (updated === null) {
      // Distinguir "no existe" de "versión desactualizada"
      const existing = await this.repo.findById(id);
      if (!existing) throw new ProductNotFoundAdminError(id);
      throw new OptimisticConcurrencyError('product', id);
    }

    return updated;
  }
}
