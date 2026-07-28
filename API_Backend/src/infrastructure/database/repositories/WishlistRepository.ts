import { sql } from 'kysely';
import { db } from '../client';
import { IWishlistRepository, WishlistItem } from '../../../application/interfaces/IWishlistRepository';
import { Product } from '../../../domain/entities/Product';

export class WishlistRepository implements IWishlistRepository {
  async add(userId: string, productId: string): Promise<boolean> {
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
    const rows = await db
      .selectFrom('wishlists')
      .innerJoin('products', 'products.id', 'wishlists.product_id')
      .selectAll('products')
      .select(
        sql<string>`(SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = products.id)`.as('total_stock'),
      )
      .where('wishlists.user_id', '=', userId)
      .where('products.is_deleted', '=', false)
      .where('products.status', '=', 'ACTIVE')
      .orderBy('wishlists.created_at', 'desc')
      .execute();

    const productIds = rows.map(r => r.id);
    let catMap = new Map();
    if (productIds.length > 0) {
      const catRows = await db.selectFrom('product_categories')
        .select(['product_id', 'category_id'])
        .where('product_id', 'in', productIds)
        .execute();
      
      catRows.forEach(r => {
        if (!catMap.has(r.product_id)) catMap.set(r.product_id, []);
        catMap.get(r.product_id).push(r.category_id);
      });
    }

    return rows.map((row) => ({ 
        ...this.mapRow({ ...row, category_ids: catMap.get(row.id) || [] } as any), 
        totalStock: Number(row.total_stock) 
    }));
  }

  private mapRow(row: any): Product {
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
}
