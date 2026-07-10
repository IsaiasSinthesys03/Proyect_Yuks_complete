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

    const category = await this.repo.findCategoryById(dto.categoryId);
    if (!category) throw new CategoryNotFoundError(dto.categoryId);

    return this.repo.create(
      {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        hasVirtualReward: dto.hasVirtualReward ?? false,
      },
      context
    );
  }
}
