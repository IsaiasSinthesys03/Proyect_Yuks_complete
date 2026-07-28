import { sql, Transaction } from 'kysely';
import { db } from '../client';
import { Database } from '../schema/db-types';
import { withAdminAuditContext } from '../withAdminAuditContext';
import { IAdminProductRepository } from '../../../application/interfaces/IAdminProductRepository';
import { AdminAuditContext } from '../../../domain/types/AdminTypes';
import { Category } from '../../../domain/entities/Category';
import { Product } from '../../../domain/entities/Product';
import { ProductVariant } from '../../../domain/entities/ProductVariant';

/**
 * Adaptador de infraestructura para operaciones CMS sobre el catálogo.
 *
 * INVARIANTE CENTRAL: todas las mutaciones (INSERT/UPDATE) ocurren dentro
 * de `withAdminAuditContext`, que abre una transacción Kysely y establece
 * `app.current_admin_*` vía `set_config()` ANTES de ejecutar el DML.
 * Esto garantiza que los triggers SQL (migración 009) lean el contexto del
 * admin y escriban en `audit_logs` de forma atómica en la misma transacción.
 */
export class AdminProductRepository implements IAdminProductRepository {

  // ==========================================
  // Lectura (sin transacción)
  // ==========================================

  async findById(id: string): Promise<Product | null> {
    const row = await db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .where('is_deleted', '=', false)
      .executeTakeFirst();
    if (!row) return null;
    const catRows = await db.selectFrom('product_categories').select('category_id').where('product_id', '=', id).execute();
    return this.mapProduct({ ...row, category_ids: catRows.map(c => c.category_id) } as any);
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const row = await db
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.mapCategory(row) : null;
  }

  async findCategoryByName(name: string): Promise<Category | null> {
    const row = await db
      .selectFrom('categories')
      .selectAll()
      .where(sql<boolean>`lower(name) = lower(${name})`)
      .executeTakeFirst();
    return row ? this.mapCategory(row) : null;
  }

  async findVariantById(id: string): Promise<ProductVariant | null> {
    const row = await db
      .selectFrom('product_variants')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.mapVariant(row) : null;
  }

  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await db
      .selectFrom('product_variants')
      .selectAll()
      .where('product_id', '=', productId)
      .orderBy('sku', 'asc')
      .execute();
    return rows.map((r) => this.mapVariant(r));
  }

  // ==========================================
  // Escritura (dentro de withAdminAuditContext)
  // ==========================================

  async create(
    data: {
      categoryIds: string[];
      name: string;
      description?: string | null;
      price: number;
      status?: string;
      hasVirtualReward?: boolean;
    },
    context: AdminAuditContext
  ): Promise<Product> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .insertInto('products')
        .values({
          name: data.name,
          description: data.description ?? null,
          price: data.price.toFixed(2),
          status: data.status ?? 'ACTIVE',
          has_virtual_reward: data.hasVirtualReward ?? false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (data.categoryIds.length > 0) {
        await trx.insertInto('product_categories').values(
          data.categoryIds.map(cId => ({
            product_id: row.id,
            category_id: cId
          }))
        ).execute();
      }

      return this.mapProduct({ ...row, category_ids: data.categoryIds } as any);
    });
  }

  async update(
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
  ): Promise<Product | null> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .updateTable('products')
        .set((eb) => ({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.price !== undefined ? { price: data.price!.toFixed(2) } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.hasVirtualReward !== undefined ? { has_virtual_reward: data.hasVirtualReward } : {}),
          updated_at: new Date(),
          // OCC: incremento atómico de versión en la misma sentencia
          version: eb('version', '+', 1),
        }))
        .where('id', '=', id)
        .where('version', '=', expectedVersion)  // OCC — núcleo de esta cláusula
        .where('is_deleted', '=', false)
        .returningAll()
        .executeTakeFirst();

      if (!row) return null;

      if (data.categoryIds !== undefined) {
        await trx.deleteFrom('product_categories').where('product_id', '=', id).execute();
        if (data.categoryIds.length > 0) {
          await trx.insertInto('product_categories').values(
            data.categoryIds.map(cId => ({
              product_id: row.id,
              category_id: cId
            }))
          ).execute();
        }
      }

      const catRows = await trx.selectFrom('product_categories').select('category_id').where('product_id', '=', id).execute();

      return this.mapProduct({ ...row, category_ids: catRows.map(c => c.category_id) } as any);
    });
  }

  async softDelete(id: string, context: AdminAuditContext): Promise<boolean> {
    return withAdminAuditContext(context, async (trx) => {
      const result = await trx
        .updateTable('products')
        .set({ is_deleted: true, updated_at: new Date() })
        .where('id', '=', id)
        .where('is_deleted', '=', false)
        .executeTakeFirst();
      return result.numUpdatedRows > 0n;
    });
  }

  async createVariant(
    data: {
      productId: string;
      sku: string;
      size?: string | null;
      color?: string | null;
      stock: number;
    },
    context: AdminAuditContext
  ): Promise<ProductVariant> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .insertInto('product_variants')
        .values({
          product_id: data.productId,
          sku: data.sku,
          size: data.size ?? null,
          color: data.color ?? null,
          stock: data.stock,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return this.mapVariant(row);
    });
  }

  async updateVariant(
    id: string,
    data: { sku?: string; size?: string | null; color?: string | null },
    context: AdminAuditContext
  ): Promise<ProductVariant | null> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .updateTable('product_variants')
        .set({
          ...(data.sku !== undefined ? { sku: data.sku } : {}),
          ...(data.size !== undefined ? { size: data.size } : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
      return row ? this.mapVariant(row) : null;
    });
  }

  async adjustStockDelta(
    variantId: string,
    delta: number,
    context: AdminAuditContext
  ): Promise<ProductVariant | null> {
    return withAdminAuditContext(context, async (trx) => {
      // La condición `stock + delta >= 0` es el guardián atómico contra stock negativo.
      // Si no se cumpla, la sentencia no actualiza ninguna fila (sin error de BD).
      const row = await trx
        .updateTable('product_variants')
        .set((eb) => ({ stock: eb('stock', '+', delta) }))
        .where('id', '=', variantId)
        .where(sql<boolean>`stock + ${delta} >= 0`)
        .returningAll()
        .executeTakeFirst();
      return row ? this.mapVariant(row) : null;
    });
  }

  async setAbsoluteStock(
    variantId: string,
    stock: number,
    context: AdminAuditContext
  ): Promise<ProductVariant | null> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .updateTable('product_variants')
        .set({ stock })
        .where('id', '=', variantId)
        .where(sql<boolean>`${stock} >= 0`)
        .returningAll()
        .executeTakeFirst();
      return row ? this.mapVariant(row) : null;
    });
  }

  async createCategory(name: string, context: AdminAuditContext): Promise<Category> {
    return withAdminAuditContext(context, async (trx) => {
      const row = await trx
        .insertInto('categories')
        .values({ name })
        .returningAll()
        .executeTakeFirstOrThrow();
      return this.mapCategory(row);
    });
  }

  async updateImageUrl(
    productId: string,
    imageUrl: string,
    context: AdminAuditContext
  ): Promise<boolean> {
    return withAdminAuditContext(context, async (trx) => {
      const result = await trx
        .updateTable('products')
        .set({ image_url: imageUrl, updated_at: new Date() })
        .where('id', '=', productId)
        .where('is_deleted', '=', false)
        .executeTakeFirst();
      return result.numUpdatedRows > 0n;
    });
  }

  // ==========================================
  // Mappers: snake_case (SQL) → camelCase (Dominio)
  // ==========================================

  private mapProduct(row: any): Product {
    return {
      id: row.id,
      categoryIds: row.category_ids || [],
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      status: row.status,
      hasVirtualReward: row.has_virtual_reward,
      isDeleted: row.is_deleted,
      version: row.version,
      imageUrl: row.image_url,
      galleryUrls: row.gallery_urls ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapVariant(row: {
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

  private mapCategory(row: {
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
