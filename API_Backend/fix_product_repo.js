const fs = require('fs');

const code = import { db } from '../client';
import { sql } from 'kysely';
import { IProductRepository } from '../../../application/interfaces/IProductRepository';
import { Product, ProductWithCategory } from '../../../domain/entities/Product';
import { ProductVariant } from '../../../domain/entities/ProductVariant';
import { Category } from '../../../domain/entities/Category';
import { GetProductsQueryDTO, PaginatedResponseDTO, ProductDetailDTO } from '../../../domain/types/ProductDTOs';

export class ProductRepository implements IProductRepository {
  async findAll(query: GetProductsQueryDTO): Promise<PaginatedResponseDTO<ProductWithCategory>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    let baseQuery = db
      .selectFrom('products')
      .where('products.is_deleted', '=', false)
      .where('products.status', '=', 'ACTIVE');

    if (query.categoryIds && query.categoryIds.length > 0) {
      baseQuery = baseQuery.where('products.id', 'in', (eb) => 
        eb.selectFrom('product_categories')
          .select('product_categories.product_id')
          .where('product_categories.category_id', 'in', query.categoryIds!)
      );
    }

    if (query.minPrice !== undefined) {
      baseQuery = baseQuery.where(sql<boolean>\\\products.price >= \\\\\\);
    }
    if (query.maxPrice !== undefined) {
      baseQuery = baseQuery.where(sql<boolean>\\\products.price <= \\\\\\);
    }

    if (query.character) {
      baseQuery = baseQuery.where(sql<boolean>\\\lower(products.character) = lower(\\\)\\\);
    }

    if (query.search) {
      const raw = query.search.trim();
      const tsQuery = this.buildTsQuery(raw);
      if (tsQuery) {
        baseQuery = baseQuery.where(
          sql<boolean>\\\(products.search_vector @@ to_tsquery('spanish', \\\) OR word_similarity(\\\, products.name) > 0.3)\\\
        );
      } else {
        baseQuery = baseQuery.where(sql<boolean>\\\word_similarity(\\\, products.name) > 0.3\\\);
      }
    }

    const countResult = await baseQuery
      .select(sql<number>\\\count(*)::int\\\.as('total'))
      .executeTakeFirstOrThrow();
    const total = countResult.total;

    const sortColumnMap: Record<string, string> = {
      price: 'products.price',
      name: 'products.name',
      createdAt: 'products.created_at',
    };
    const sortColumn = sortColumnMap[query.sortBy ?? 'createdAt'] ?? 'products.created_at';
    const sortOrder = query.sortOrder ?? 'desc';

    let dataQuery = baseQuery.select([
      'products.id',
      'products.name',
      'products.description',
      'products.price',
      'products.status',
      'products.has_virtual_reward',
      'products.is_deleted',
      'products.version',
      'products.image_url',
      'products.created_at',
      'products.updated_at',
    ]);

    dataQuery = dataQuery.orderBy(sortColumn as any, sortOrder).limit(limit).offset(offset);

    const rows = await dataQuery.execute();

    const productIds = rows.map(r => r.id);
    let catMap = new Map();
    if (productIds.length > 0) {
      const catRows = await db.selectFrom('product_categories')
        .innerJoin('categories', 'categories.id', 'product_categories.category_id')
        .select([
          'product_categories.product_id', 
          'product_categories.category_id', 
          'categories.name'
        ])
        .where('product_categories.product_id', 'in', productIds)
        .execute();
      
      catRows.forEach(r => {
        if (!catMap.has(r.product_id)) catMap.set(r.product_id, { ids: [], names: [] });
        catMap.get(r.product_id).ids.push(r.category_id);
        catMap.get(r.product_id).names.push(r.name);
      });
    }

    const data = rows.map((row) => {
      const cats = catMap.get(row.id) || { ids: [], names: [] };
      return this.mapRowToProductWithCategory({ ...row, category_ids: cats.ids, category_names: cats.names } as any);
    });

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
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();

    if (!row) return null;
    
    const catRows = await db.selectFrom('product_categories')
        .select('category_id')
        .where('product_id', '=', id)
        .execute();
    
    return this.mapRowToProduct({ ...row, category_ids: catRows.map(c => c.category_id) } as any);
  }

  async findDetailById(id: string): Promise<ProductDetailDTO | null> {
    const productRow = await db
      .selectFrom('products')
      .select([
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.status',
        'products.has_virtual_reward',
        'products.is_deleted',
        'products.version',
        'products.image_url',
        'products.gallery_urls',
        'products.created_at',
        'products.updated_at',
      ])
      .where('products.id', '=', id)
      .where('products.is_deleted', '=', false)
      .where('products.status', '=', 'ACTIVE')
      .executeTakeFirst();

    if (!productRow) return null;

    const catRows = await db.selectFrom('product_categories')
        .innerJoin('categories', 'categories.id', 'product_categories.category_id')
        .select([
          'product_categories.category_id', 
          'categories.name'
        ])
        .where('product_categories.product_id', '=', id)
        .execute();

    const variantRows = await db
      .selectFrom('product_variants')
      .selectAll()
      .where('product_id', '=', id)
      .orderBy('sku', 'asc')
      .execute();

    return {
      product: this.mapRowToProductWithCategory({ 
          ...productRow, 
          category_ids: catRows.map(c => c.category_id),
          category_names: catRows.map(c => c.name) 
      } as any),
      variants: variantRows.map((row) => this.mapRowToVariant(row)),
    };
  }

  async findTopSelling(limit: number): Promise<ProductWithCategory[]> {
    const rows = await db
      .selectFrom('products')
      .select([
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.status',
        'products.has_virtual_reward',
        'products.is_deleted',
        'products.version',
        'products.image_url',
        'products.created_at',
        'products.updated_at',
      ])
      .where('products.is_deleted', '=', false)
      .where('products.status', '=', 'ACTIVE')
      .orderBy('products.created_at', 'desc')
      .limit(limit)
      .execute();

    const productIds = rows.map(r => r.id);
    let catMap = new Map();
    if (productIds.length > 0) {
      const catRows = await db.selectFrom('product_categories')
        .innerJoin('categories', 'categories.id', 'product_categories.category_id')
        .select([
          'product_categories.product_id', 
          'product_categories.category_id', 
          'categories.name'
        ])
        .where('product_categories.product_id', 'in', productIds)
        .execute();
      
      catRows.forEach(r => {
        if (!catMap.has(r.product_id)) catMap.set(r.product_id, { ids: [], names: [] });
        catMap.get(r.product_id).ids.push(r.category_id);
        catMap.get(r.product_id).names.push(r.name);
      });
    }

    return rows.map((row) => {
        const cats = catMap.get(row.id) || { ids: [], names: [] };
        return this.mapRowToProductWithCategory({ ...row, category_ids: cats.ids, category_names: cats.names } as any);
    });
  }

  async findAllCategories(): Promise<Category[]> {
    const rows = await db
      .selectFrom('categories')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.mapRowToCategory(row));
  }

  async findVariantWithProductById(variantId: string): Promise<any> {
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
        'products.status',
        'products.has_virtual_reward',
      ])
      .where('product_variants.id', '=', variantId)
      .where('products.is_deleted', '=', false)
      .where('products.status', '=', 'ACTIVE')
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

  private buildTsQuery(search: string): string {
    const sanitizedWords = search
      .replace(/[&|!:()]/g, ' ')
      .trim()
      .split(/\\\s+/)
      .filter(Boolean);

    return sanitizedWords.map((word) => \\\\\\:*\\\).join(' & ');
  }

  private mapRowToProduct(row: any): Product {
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

  private mapRowToProductWithCategory(row: any): ProductWithCategory {
    return {
      ...this.mapRowToProduct(row),
      categoryNames: row.category_names || [],
    };
  }

  private mapRowToVariant(row: any): ProductVariant {
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

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }
}
;

fs.writeFileSync('src/infrastructure/database/repositories/ProductRepository.ts', code);
