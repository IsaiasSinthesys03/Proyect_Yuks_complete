import { sql } from 'kysely';
import { db } from '../client';
import { IWishlistRepository, WishlistItem } from '../../../application/interfaces/IWishlistRepository';
import { Product } from '../../../domain/entities/Product';

export class WishlistRepository implements IWishlistRepository {
  async add(userId: string, productId: string): Promise<boolean> {
    // ON CONFLICT DO NOTHING → idempotente. returningAll() no devuelve fila si
    // hubo conflicto (ya existía), así que la presencia de fila == inserción nueva.
    const inserted = await db
      .insertInto('wishlists')
      .values({ user_id: userId, product_id: productId })
      .onConflict((oc) => oc.columns(['user_id', 'product_id']).doNothing())
      .returningAll()
      .executeTakeFirst();

    return !!inserted;
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const result = await db
      .deleteFrom('wishlists')
      .where('user_id', '=', userId)
      .where('product_id', '=', productId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  }

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    // Solo productos activos (no soft-deleted) — un producto descontinuado no
    // debe aparecer en la lista aunque el registro de wishlist persista.
    // Fase 44: se agrega el stock TOTAL (suma de variantes) vía subconsulta
    // para pintar "Agotado" en vivo sin N+1 llamadas (REQ-FE-19).
    const rows = await db
      .selectFrom('wishlists')
      .innerJoin('products', 'products.id', 'wishlists.product_id')
      .selectAll('products')
      .select(
        sql<string>`(SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = products.id)`.as('total_stock'),
      )
      .where('wishlists.user_id', '=', userId)
      .where('products.is_deleted', '=', false)
      .orderBy('wishlists.created_at', 'desc')
      .execute();

    return rows.map((row) => ({ ...this.mapRow(row), totalStock: Number(row.total_stock) }));
  }

  private mapRow(row: {
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
}
