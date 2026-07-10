import { db } from '../client';
import { sql } from 'kysely';
import { IProductRepository } from '../../../application/interfaces/IProductRepository';
import { Product, ProductWithCategory } from '../../../domain/entities/Product';
import { ProductVariant } from '../../../domain/entities/ProductVariant';
import { Category } from '../../../domain/entities/Category';
import { GetProductsQueryDTO, PaginatedResponseDTO, ProductDetailDTO } from '../../../domain/types/ProductDTOs';

/**
 * Implementación concreta de IProductRepository usando Kysely.
 *
 * Este adaptador vive en la capa de Infraestructura y es el ÚNICO lugar
 * donde se tocan tipos de SQL (snake_case) y Kysely para el catálogo.
 * Traduce entre el formato de la BD (snake_case) y las Entidades de Dominio (camelCase).
 *
 * REGLA DE ORO: Toda consulta a `products` DEBE incluir `WHERE is_deleted = false`.
 */
export class ProductRepository implements IProductRepository {

  async findAll(query: GetProductsQueryDTO): Promise<PaginatedResponseDTO<ProductWithCategory>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    // --- Query base: productos activos con JOIN a categorías ---
    let baseQuery = db
      .selectFrom('products')
      .innerJoin('categories', 'categories.id', 'products.category_id')
      .where('products.is_deleted', '=', false);

    // Filtro por categoría
    if (query.categoryId) {
      baseQuery = baseQuery.where('products.category_id', '=', query.categoryId);
    }

    // Filtro por rango de precio (REQ-FE-12)
    if (query.minPrice !== undefined) {
      baseQuery = baseQuery.where(sql<boolean>`products.price >= ${query.minPrice}`);
    }
    if (query.maxPrice !== undefined) {
      baseQuery = baseQuery.where(sql<boolean>`products.price <= ${query.maxPrice}`);
    }

    // Filtro por Personaje (REQ-FE-12), case-insensitive
    if (query.character) {
      baseQuery = baseQuery.where(sql<boolean>`lower(products.character) = lower(${query.character})`);
    }

    // Búsqueda por nombre: Full-Text Search (stemming) COMBINADA con similitud de
    // trigramas (fuzzy / tolerancia a typos) — REQ-BE-03. La condición es un OR:
    //   - FTS `@@ to_tsquery` cubre coincidencias por raíz/prefijo.
    //   - `word_similarity` (pg_trgm) cubre errores ortográficos ("pikchu"→"Pikachu").
    // El umbral 0.3 se validó empíricamente (Fase 33). Índices: GIN tsvector (008)
    // + GIN trigram sobre name (018).
    if (query.search) {
      const raw = query.search.trim();
      const tsQuery = this.buildTsQuery(raw);
      if (tsQuery) {
        baseQuery = baseQuery.where(
          sql<boolean>`(products.search_vector @@ to_tsquery('spanish', ${tsQuery}) OR word_similarity(${raw}, products.name) > 0.3)`
        );
      } else {
        // El texto quedó vacío tras sanitizar tsquery: usar solo similitud fuzzy.
        baseQuery = baseQuery.where(sql<boolean>`word_similarity(${raw}, products.name) > 0.3`);
      }
    }

    // --- Conteo total (para paginación) ---
    const countResult = await baseQuery
      .select(sql<number>`count(*)::int`.as('total'))
      .executeTakeFirstOrThrow();

    const total = countResult.total;

    // --- Columna de ordenamiento ---
    const sortColumnMap: Record<string, string> = {
      price: 'products.price',
      name: 'products.name',
      createdAt: 'products.created_at',
    };
    const sortColumn = sortColumnMap[query.sortBy ?? 'createdAt'] ?? 'products.created_at';
    const sortOrder = query.sortOrder ?? 'desc';

    // --- Consulta paginada con datos ---
    let dataQuery = baseQuery.select([
      'products.id',
      'products.category_id',
      'products.name',
      'products.description',
      'products.price',
      'products.has_virtual_reward',
      'products.is_deleted',
      'products.version',
      'products.image_url',
      'products.created_at',
      'products.updated_at',
      'categories.name as category_name',
    ]);

    // Cuando hay búsqueda, ordenar PRIMERO por relevancia fuzzy (mejor match arriba),
    // luego por el criterio solicitado como desempate.
    if (query.search) {
      dataQuery = dataQuery.orderBy(sql`word_similarity(${query.search.trim()}, products.name) DESC`);
    }

    const rows = await dataQuery
      .orderBy(sql.raw(`${sortColumn} ${sortOrder}`))
      .limit(limit)
      .offset(offset)
      .execute();

    const data = rows.map((row) => this.mapRowToProductWithCategory(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Product | null> {
    const row = await db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .where('is_deleted', '=', false)
      .executeTakeFirst();

    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  async findDetailById(id: string): Promise<ProductDetailDTO | null> {
    // 1. Buscar producto con su categoría
    const productRow = await db
      .selectFrom('products')
      .innerJoin('categories', 'categories.id', 'products.category_id')
      .select([
        'products.id',
        'products.category_id',
        'products.name',
        'products.description',
        'products.price',
        'products.has_virtual_reward',
        'products.is_deleted',
        'products.version',
        'products.image_url',
        'products.created_at',
        'products.updated_at',
        'categories.name as category_name',
      ])
      .where('products.id', '=', id)
      .where('products.is_deleted', '=', false)
      .executeTakeFirst();

    if (!productRow) return null;

    // 2. Buscar todas las variantes del producto
    const variantRows = await db
      .selectFrom('product_variants')
      .selectAll()
      .where('product_id', '=', id)
      .orderBy('sku', 'asc')
      .execute();

    return {
      product: this.mapRowToProductWithCategory(productRow),
      variants: variantRows.map((row) => this.mapRowToVariant(row)),
    };
  }

  async findTopSelling(limit: number): Promise<ProductWithCategory[]> {
    // Placeholder: retorna los productos más recientes.
    // Se sustituirá por JOIN con order_items + GROUP BY + ORDER BY SUM(quantity) DESC
    // cuando se implemente el módulo de órdenes.
    const rows = await db
      .selectFrom('products')
      .innerJoin('categories', 'categories.id', 'products.category_id')
      .select([
        'products.id',
        'products.category_id',
        'products.name',
        'products.description',
        'products.price',
        'products.has_virtual_reward',
        'products.is_deleted',
        'products.version',
        'products.image_url',
        'products.created_at',
        'products.updated_at',
        'categories.name as category_name',
      ])
      .where('products.is_deleted', '=', false)
      .orderBy('products.created_at', 'desc')
      .limit(limit)
      .execute();

    return rows.map((row) => this.mapRowToProductWithCategory(row));
  }

  async findAllCategories(): Promise<Category[]> {
    const rows = await db
      .selectFrom('categories')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.mapRowToCategory(row));
  }

  async findVariantWithProductById(variantId: string): Promise<{
    variant: ProductVariant;
    productId: string;
    productName: string;
    price: number;
    hasVirtualReward: boolean;
  } | null> {
    const row = await db
      .selectFrom('product_variants')
      .innerJoin('products', 'products.id', 'product_variants.product_id')
      .select([
        'product_variants.id',
        'product_variants.product_id',
        'product_variants.sku',
        'product_variants.size',
        'product_variants.color',
        'product_variants.stock',
        'product_variants.created_at',
        'products.name as product_name',
        'products.price',
        'products.has_virtual_reward',
      ])
      .where('product_variants.id', '=', variantId)
      .where('products.is_deleted', '=', false)
      .executeTakeFirst();

    if (!row) return null;

    return {
      variant: this.mapRowToVariant(row),
      productId: row.product_id,
      productName: row.product_name,
      price: parseFloat(row.price),
      hasVirtualReward: row.has_virtual_reward,
    };
  }

  async decrementStock(variantId: string, quantity: number): Promise<boolean> {
    const result = await db
      .updateTable('product_variants')
      .set((eb) => ({ stock: eb('stock', '-', quantity) }))
      .where('id', '=', variantId)
      .where('stock', '>=', quantity)
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  }

  async restoreStock(variantId: string, quantity: number): Promise<void> {
    await db
      .updateTable('product_variants')
      .set((eb) => ({ stock: eb('stock', '+', quantity) }))
      .where('id', '=', variantId)
      .execute();
  }

  /**
   * Construye una expresión `tsquery` segura a partir del texto libre del usuario.
   *
   * - Sanitiza caracteres especiales de tsquery (`&`, `|`, `!`, `:`, `(`, `)`) para
   *   evitar que el usuario inyecte operadores booleanos no intencionados.
   * - Aplica el sufijo `:*` a cada palabra para habilitar coincidencia de PREFIJO
   *   (ej. "Pla" encuentra "Playera"), cubriendo el caso de uso del Omnibox (REQ-FE-12).
   * - Une las palabras con `&` (AND) — todas las palabras deben aparecer.
   *
   * NOTA: Esto NO es tolerancia a errores ortográficos (fuzzy matching) en el sentido
   * de Levenshtein — eso requeriría la extensión `pg_trgm` con un índice GIN adicional,
   * fuera del alcance de esta remediación. Lo que sí resuelve de raíz es el anti-patrón
   * `ILIKE` (full table scan, sin índice aprovechable) exigido por REQ-BE-03.
   */
  private buildTsQuery(search: string): string {
    const sanitizedWords = search
      .replace(/[&|!:()]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return sanitizedWords.map((word) => `${word}:*`).join(' & ');
  }

  // --- Mappers privados: traducen snake_case (SQL) → camelCase (Dominio) ---

  private mapRowToProduct(row: {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: string;
    has_virtual_reward: boolean;
    is_deleted: boolean;
    version: number;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
  }): Product {
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      hasVirtualReward: row.has_virtual_reward,
      isDeleted: row.is_deleted,
      version: row.version,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToProductWithCategory(row: {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: string;
    has_virtual_reward: boolean;
    is_deleted: boolean;
    version: number;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
    category_name: string;
  }): ProductWithCategory {
    return {
      ...this.mapRowToProduct(row),
      categoryName: row.category_name,
    };
  }

  private mapRowToVariant(row: {
    id: string;
    product_id: string;
    sku: string;
    size: string | null;
    color: string | null;
    stock: number;
    created_at: Date;
  }): ProductVariant {
    return {
      id: row.id,
      productId: row.product_id,
      sku: row.sku,
      size: row.size,
      color: row.color,
      stock: row.stock,
      createdAt: row.created_at,
    };
  }

  private mapRowToCategory(row: {
    id: string;
    name: string;
    created_at: Date;
  }): Category {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }
}
