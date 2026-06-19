import { IProductRepository } from '../interfaces/IProductRepository';
import { ProductDetailDTO } from '../../domain/types/ProductDTOs';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

/**
 * Caso de Uso: Obtener detalle completo de un producto.
 *
 * Busca un producto por su ID, incluyendo su categoría y todas
 * sus variantes con stock. Si el producto no existe o está
 * descontinuado (Soft Delete), lanza ProductNotFoundError.
 *
 * Dependencias inyectadas:
 *   - IProductRepository (puerto — capa de aplicación).
 */
export class GetProductDetailUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string): Promise<ProductDetailDTO> {
    const detail = await this.productRepository.findDetailById(productId);

    if (!detail) {
      throw new ProductNotFoundError(productId);
    }

    return detail;
  }
}
