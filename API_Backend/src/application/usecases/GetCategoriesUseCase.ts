import { IProductRepository } from '../interfaces/IProductRepository';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de Uso: Obtener todas las categorías del catálogo.
 *
 * Retorna la lista completa de categorías para poblar los filtros
 * del catálogo público y el selector dinámico estilo Notion del CMS
 * (CMS-FE-06 / CMS-BE-07).
 *
 * Dependencias inyectadas:
 *   - IProductRepository (puerto — capa de aplicación).
 */
export class GetCategoriesUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(): Promise<Category[]> {
    return this.productRepository.findAllCategories();
  }
}
