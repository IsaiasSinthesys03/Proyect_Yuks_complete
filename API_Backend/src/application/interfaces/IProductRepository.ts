import { Category } from '../../domain/entities/Category';
import { Product, ProductWithCategory } from '../../domain/entities/Product';
import { GetProductsQueryDTO, PaginatedResponseDTO, ProductDetailDTO } from '../../domain/types/ProductDTOs';

/**
 * Puerto (Interfaz) del Repositorio de Productos.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la capa de Infrastructure debe implementar.
 * - Solo recibe y devuelve Entidades de Dominio (Product, Category, ProductVariant)
 *   y DTOs puros (GetProductsQueryDTO, PaginatedResponseDTO, ProductDetailDTO).
 * - Jamás expone tipos de Kysely, SQL, o cualquier detalle de persistencia.
 * - Los Use Cases dependen de esta abstracción, no de la implementación concreta.
 */
export interface IProductRepository {
  /**
   * Listado paginado de productos con búsqueda y filtros.
   * Excluye automáticamente productos soft-deleted (is_deleted = true).
   *
   * @param query - Parámetros de búsqueda, paginación y ordenamiento.
   * @returns Respuesta paginada con productos enriquecidos con su nombre de categoría.
   */
  findAll(query: GetProductsQueryDTO): Promise<PaginatedResponseDTO<ProductWithCategory>>;

  /**
   * Busca un producto activo por su ID (UUID).
   * Excluye productos soft-deleted.
   *
   * @returns El producto encontrado, o null si no existe o está descontinuado.
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Detalle completo de un producto: datos del producto + categoría + variantes.
   * Excluye productos soft-deleted.
   *
   * @returns El detalle completo, o null si el producto no existe.
   */
  findDetailById(id: string): Promise<ProductDetailDTO | null>;

  /**
   * Retorna los productos más vendidos para la sección "Top Ventas" del Landing.
   * Placeholder inicial: retorna los más recientes hasta que exista la tabla de órdenes.
   *
   * @param limit - Cantidad máxima de productos a retornar (default: 10).
   * @returns Lista de productos enriquecidos con su nombre de categoría.
   */
  findTopSelling(limit: number): Promise<ProductWithCategory[]>;

  /**
   * Lista todas las categorías del sistema, ordenadas alfabéticamente.
   *
   * @returns Lista completa de categorías.
   */
  findAllCategories(): Promise<Category[]>;
}
