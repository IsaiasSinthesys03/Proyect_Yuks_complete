import { IProductRepository } from '../interfaces/IProductRepository';
import { GetProductsQueryDTO, PaginatedResponseDTO } from '../../domain/types/ProductDTOs';
import { ProductWithCategory } from '../../domain/entities/Product';

/**
 * Caso de Uso: Obtener listado paginado de productos.
 *
 * Orquesta la consulta al catálogo público con búsqueda, filtros
 * y paginación. Aplica valores por defecto y límites de seguridad
 * antes de delegar al repositorio.
 *
 * Dependencias inyectadas:
 *   - IProductRepository (puerto — capa de aplicación).
 */
export class GetProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(query: GetProductsQueryDTO): Promise<PaginatedResponseDTO<ProductWithCategory>> {
    // Sanitizar y aplicar valores por defecto de paginación
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Math.floor(query.limit ?? 12)));

    const sanitizedQuery: GetProductsQueryDTO = {
      search: query.search?.trim() || undefined,
      categoryId: query.categoryId || undefined,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };

    return this.productRepository.findAll(sanitizedQuery);
  }
}
