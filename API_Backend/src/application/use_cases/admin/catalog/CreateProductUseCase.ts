import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { CreateProductDTO } from '../../../../domain/types/AdminProductDTOs';
import { AdminAuditContext } from '../../../../domain/types/AdminTypes';
import { Product } from '../../../../domain/entities/Product';
import {
  InvalidPriceError,
  CategoryNotFoundError,
} from '../../../../domain/errors/ProductAdminErrors';

export class CreateProductUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(dto: CreateProductDTO, context: AdminAuditContext): Promise<Product> {
    if (dto.price <= 0) throw new InvalidPriceError();

    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new Error('At least one category is required');
    }
    for (const categoryId of dto.categoryIds) {
      const category = await this.repo.findCategoryById(categoryId);
      if (!category) throw new CategoryNotFoundError(categoryId);
    }

    return this.repo.create(
      {
        categoryIds: dto.categoryIds,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        status: dto.status,
        hasVirtualReward: dto.hasVirtualReward ?? false,
      },
      context
    );
  }
}
