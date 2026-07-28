import { IAdminProductRepository } from '../../../interfaces/IAdminProductRepository';
import { ProductDetailDTO } from '../../../../domain/types/ProductDTOs';
import { ProductNotFoundAdminError } from '../../../../domain/errors/ProductAdminErrors';

export class GetAdminProductDetailUseCase {
  constructor(private readonly repo: IAdminProductRepository) {}

  async execute(productId: string): Promise<ProductDetailDTO> {
    const product = await this.repo.findById(productId);
    
    if (!product) {
      throw new ProductNotFoundAdminError(productId);
    }
    
    const variants = await this.repo.findVariantsByProductId(productId);
    const categoryNames: string[] = [];
    for (const cId of product.categoryIds) {
       const cat = await this.repo.findCategoryById(cId);
       if (cat) categoryNames.push(cat.name);
    }

    return {
      product: {
        id: product.id,
        categoryIds: product.categoryIds,
        categoryNames,
        name: product.name,
        description: product.description ?? null,
        price: product.price,
        status: product.status,
        hasVirtualReward: product.hasVirtualReward,
        isDeleted: product.isDeleted,
        version: product.version,
        imageUrl: product.imageUrl,
        galleryUrls: product.galleryUrls,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      variants: variants.map(v => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        size: v.size ?? null,
        color: v.color ?? null,
        stock: v.stock,
        createdAt: v.createdAt,
      })),
    };
  }
}
