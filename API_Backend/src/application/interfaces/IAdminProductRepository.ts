import { AdminAuditContext } from '../../domain/types/AdminTypes';
import { Category } from '../../domain/entities/Category';
import { Product } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';

/**
 * Puerto (Interfaz) del repositorio de catálogo para operaciones CMS.
 *
 * Separado de `IProductRepository` deliberadamente:
 *   - Las operaciones de escritura reciben `AdminAuditContext` para que la
 *     implementación concreta pueda ejecutarlas dentro de `withAdminAuditContext`,
 *     garantizando que los triggers de auditoría SQL vean el contexto del admin.
 *   - La capa de aplicación (use cases) nunca importa Kysely ni transacciones;
 *     solo conoce este contrato de dominio puro.
 */
export interface IAdminProductRepository {

  // ==========================================
  // Lectura (sin contexto de auditoría)
  // ==========================================

  /** Busca un producto activo (no soft-deleted) por ID. */
  findById(id: string): Promise<Product | null>;

  /** Busca una categoría por su ID. */
  findCategoryById(id: string): Promise<Category | null>;

  /** Busca una categoría por su nombre (case-insensitive). */
  findCategoryByName(name: string): Promise<Category | null>;

  /** Busca una variante por su ID (sin filtro de producto soft-deleted). */
  findVariantById(id: string): Promise<ProductVariant | null>;

  /** Busca todas las variantes de un producto. */
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;

  // ==========================================
  // Escritura (con contexto de auditoría)
  // ==========================================

  /**
   * Crea un nuevo producto.
   * El trigger `fn_write_audit_log` escribe en `audit_logs` con action='CREATE'.
   */
  create(data: {
    categoryIds: string[];
    name: string;
    description?: string | null;
    price: number;
    status?: string;
    hasVirtualReward?: boolean;
  }, context: AdminAuditContext): Promise<Product>;

  /**
   * Actualiza un producto con OCC (Optimistic Concurrency Control).
   *
   * La implementación DEBE usar `WHERE id = :id AND version = :expectedVersion`.
   * Si la cláusula WHERE no coincide con ninguna fila, retorna `null`.
   * El caller (use case) distingue "not found" de "version mismatch" consultando
   * `findById` antes de lanzar el error apropiado.
   *
   * La BD incrementa `version` automáticamente: `SET version = version + 1`.
   */
  update(
    id: string,
    data: {
      categoryIds?: string[];
      name?: string;
      description?: string | null;
      price?: number;
      status?: string;
      hasVirtualReward?: boolean;
    },
    expectedVersion: number,
    context: AdminAuditContext
  ): Promise<Product | null>;

  /**
   * Marca un producto como eliminado (soft delete).
   * El trigger detecta `is_deleted: false → true` y registra action='SOFT_DELETE'.
   *
   * @returns `true` si se eliminó, `false` si no existía (o ya estaba eliminado).
   */
  softDelete(id: string, context: AdminAuditContext): Promise<boolean>;

  /**
   * Crea una nueva variante de producto.
   * Lanza error de BD con código 23505 si el SKU ya existe — el caller lo convierte
   * en `DuplicateSkuError`.
   */
  createVariant(data: {
    productId: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    stock: number;
  }, context: AdminAuditContext): Promise<ProductVariant>;

  /**
   * Actualiza campos de una variante (SKU, talla, color).
   * @returns La variante actualizada, o `null` si no existe.
   */
  updateVariant(
    id: string,
    data: { sku?: string; size?: string | null; color?: string | null },
    context: AdminAuditContext
  ): Promise<ProductVariant | null>;

  /**
   * Ajusta el stock de una variante de forma atómica por un delta.
   *
   * La implementación DEBE usar `SET stock = stock + delta WHERE stock + delta >= 0`.
   * Si el resultado sería negativo, no actualiza ninguna fila y retorna `null`.
   *
   * @returns La variante con stock actualizado, o `null` si el stock resultante sería < 0.
   */
  adjustStockDelta(variantId: string, delta: number, context: AdminAuditContext): Promise<ProductVariant | null>;

  /**
   * Sobrescribe el stock absoluto de una variante (ej: conteo físico).
   * Lanza error si stock < 0.
   */
  setAbsoluteStock(variantId: string, stock: number, context: AdminAuditContext): Promise<ProductVariant | null>;

  /**
   * Crea una nueva categoría.
   * El trigger registra action='CREATE' en `audit_logs`.
   */
  createCategory(name: string, context: AdminAuditContext): Promise<Category>;

  /**
   * Actualiza la URL de imagen de un producto (Fase 23 — upload pipeline).
   *
   * No usa OCC: `image_url` no es disputado concurrentemente por operaciones
   * de negocio. El trigger registra la mutación con action='UPDATE'.
   *
   * @returns `true` si se actualizó, `false` si el producto no existe o fue eliminado.
   */
  updateImageUrl(productId: string, imageUrl: string, context: AdminAuditContext): Promise<boolean>;
}
