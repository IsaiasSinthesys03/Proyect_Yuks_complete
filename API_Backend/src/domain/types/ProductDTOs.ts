import { ProductWithCategory } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';

/**
 * Data Transfer Objects para el módulo de Catálogo de Productos.
 *
 * Estos tipos definen la FORMA de los datos que entran y salen
 * de los Use Cases. No contienen lógica de negocio.
 */

/**
 * Parámetros de búsqueda y paginación para el listado de productos.
 * Todos los campos son opcionales — los Use Cases asignan valores por defecto.
 */
export interface GetProductsQueryDTO {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta paginada genérica.
 * Reutilizable para cualquier listado paginado del sistema.
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO de salida para la vista individual de un producto.
 * Incluye el producto enriquecido con su categoría y la lista
 * completa de variantes con su stock actual.
 */
export interface ProductDetailDTO {
  product: ProductWithCategory;
  variants: ProductVariant[];
}
