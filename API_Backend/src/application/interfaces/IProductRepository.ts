import { Category } from '../../domain/entities/Category';
import { Product, ProductWithCategory } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
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

  /**
   * Obtiene una variante junto con los datos del producto padre necesarios
   * para congelar el snapshot del checkout (REQ-BE-01): precio, nombre y
   * flag de recompensa virtual. El precio vive en `products`, no en la
   * variante — todas las variantes de un producto comparten el mismo precio.
   *
   * @returns `null` si la variante no existe o el producto está soft-deleted.
   */
  findVariantWithProductById(variantId: string): Promise<{
    variant: ProductVariant;
    productId: string;
    productName: string;
    price: number;
    hasVirtualReward: boolean;
  } | null>;

  /**
   * Obtiene múltiples variantes por sus IDs.
   * Útil para validar el stock del carrito en bloque.
   *
   * @param variantIds Lista de UUIDs de las variantes a buscar.
   */
  findVariantsByIds(variantIds: string[]): Promise<ProductVariant[]>;

  /**
   * Decrementa el stock de una variante de forma atómica.
   *
   * La implementación DEBE usar una operación condicional SQL
   * (`UPDATE product_variants SET stock = stock - quantity WHERE id = variantId AND stock >= quantity`)
   * para servir como el guardián final contra race conditions (REQ-BE-01, Paso 10).
   *
   * @returns `true` si el decremento tuvo éxito, `false` si no había stock suficiente.
   */
  decrementStock(variantId: string, quantity: number): Promise<boolean>;

  /**
   * Restaura stock de una variante (operación delta, sin condición).
   * Usado al cancelar un pedido para devolver el inventario reservado.
   */
  restoreStock(variantId: string, quantity: number): Promise<void>;
}
