import { IProductRepository } from '../interfaces/IProductRepository';
import { ProductWithCategory } from '../../domain/entities/Product';

/**
 * Caso de Uso: Obtener los productos más vendidos (Top Ventas).
 *
 * Retorna los productos más vendidos para la sección "Top Ventas"
 * del Landing Page (REQ-FE-02). Valida el límite con un valor
 * por defecto de 10 y un máximo de 20.
 *
 * Nota: La lógica de caché Redis (TTL 1h según REQ-BE-03) se
 * implementará en la capa de infraestructura (controlador o
 * middleware), NO aquí, para mantener la pureza de la capa
 * de aplicación.
 *
 * Dependencias inyectadas:
 *   - IProductRepository (puerto — capa de aplicación).
 */
export class GetTopProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(limit?: number): Promise<ProductWithCategory[]> {
    const sanitizedLimit = Math.min(20, Math.max(1, Math.floor(limit ?? 10)));

    return this.productRepository.findTopSelling(sanitizedLimit);
  }
}
