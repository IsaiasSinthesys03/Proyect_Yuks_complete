import { db } from '../client';
import { IAdminInventoryRepository } from '../../../application/interfaces/IAdminInventoryRepository';
import { PaginatedResponseDTO } from '../../../domain/types/ProductDTOs';
import { InventoryItemDTO, AdminProductListItemDTO, StockStatus } from '../../../domain/types/InventoryDTOs';

/** Umbral de "Stock Bajo" para el badge del monitor de inventario. */
const LOW_STOCK_THRESHOLD = 5;

function deriveStatus(stock: number): StockStatus {
  if (stock <= 0) return 'AGOTADO';
  if (stock <= LOW_STOCK_THRESHOLD) return 'STOCK_BAJO';
  return 'ACTIVO';
}

export class AdminInventoryRepository implements IAdminInventoryRepository {
  async findAllVariantsPaginated(page: number, limit: number, search?: string, status?: string): Promise<PaginatedResponseDTO<InventoryItemDTO>> {
    const offset = (page - 1) * limit;

    let baseQuery = db
      .selectFrom('product_variants')
      .innerJoin('products', 'products.id', 'product_variants.product_id');

    if (search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('product_variants.sku', 'ilike', `%${search}%`),
          eb('products.name', 'ilike', `%${search}%`)
        ])
      );
    }

    if (status) {
      if (status === 'AGOTADO') {
        baseQuery = baseQuery.where('product_variants.stock', '<=', 0);
      } else if (status === 'STOCK_BAJO') {
        baseQuery = baseQuery.where('product_variants.stock', '>', 0).where('product_variants.stock', '<=', LOW_STOCK_THRESHOLD);
      } else if (status === 'ACTIVO') {
        baseQuery = baseQuery.where('product_variants.stock', '>', LOW_STOCK_THRESHOLD);
      }
    }

    const countRow = await baseQuery
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    const total = Number(countRow.total);

    const rows = await baseQuery
      .select([
        'products.id as product_id',
        'products.name as product_name',
        'products.is_deleted as is_deleted',
        'products.version as version',
        'products.price as price',
        'product_variants.id as variant_id',
        'product_variants.sku as sku',
        'product_variants.size as size',
        'product_variants.color as color',
        'product_variants.stock as stock',
      ])
      .orderBy('product_variants.stock', 'asc') // los más críticos (agotados) primero
      .orderBy('products.name', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      data: rows.map((r) => ({
        productId: r.product_id,
        productName: r.product_name,
        isDeleted: r.is_deleted,
        version: r.version,
        variantId: r.variant_id,
        sku: r.sku,
        size: r.size,
        color: r.color,
        price: parseFloat(r.price),
        stock: r.stock,
        status: deriveStatus(r.stock),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllProductsPaginated(page: number, limit: number, includeDeleted: boolean, search?: string, status?: string): Promise<PaginatedResponseDTO<AdminProductListItemDTO>> {
    const offset = (page - 1) * limit;

    let countBase = db.selectFrom('products');
    if (!includeDeleted) countBase = countBase.where('is_deleted', '=', false);
    if (search) {
      countBase = countBase.where('name', 'ilike', `%${search}%`);
    }
    if (status) {
      if (status === 'ACTIVE' || status === 'DRAFT') {
        countBase = countBase.where('status', '=', status);
      } else if (status === 'ARCHIVED') {
        countBase = countBase.where('is_deleted', '=', true);
      }
    }
    
    const countRow = await countBase.select((eb) => eb.fn.countAll<number>().as('total')).executeTakeFirstOrThrow();
    const total = Number(countRow.total);

    let dataBase = db.selectFrom('products');
      
    if (!includeDeleted) dataBase = dataBase.where('products.is_deleted', '=', false);
    if (search) {
      dataBase = dataBase.where('products.name', 'ilike', `%${search}%`);
    }
    if (status) {
      if (status === 'ACTIVE' || status === 'DRAFT') {
        dataBase = dataBase.where('products.status', '=', status);
      } else if (status === 'ARCHIVED') {
        dataBase = dataBase.where('products.is_deleted', '=', true);
      }
    }

    const rows = await dataBase
      .select([
        'products.id as id',
        'products.name as name',
        'products.price as price',
        'products.status as status',
        'products.has_virtual_reward as has_virtual_reward',
        'products.is_deleted as is_deleted',
        'products.version as version',
        'products.character as character',
        'products.created_at as created_at',
      ])
      .orderBy('products.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    const productIds = rows.map(r => r.id);
    let catMap = new Map();
    if (productIds.length > 0) {
      const catRows = await db.selectFrom('product_categories')
        .innerJoin('categories', 'categories.id', 'product_categories.category_id')
        .select(['product_categories.product_id', 'categories.name'])
        .where('product_categories.product_id', 'in', productIds)
        .execute();
      
      catRows.forEach(r => {
        if (!catMap.has(r.product_id)) catMap.set(r.product_id, []);
        catMap.get(r.product_id).push(r.name);
      });
    }

    return {
      data: rows.map((r) => {
        const catNames = catMap.get(r.id) || [];
        return {
          id: r.id,
          name: r.name,
          categoryName: catNames.join(', '),
          price: parseFloat(r.price),
          status: r.status,
          hasVirtualReward: r.has_virtual_reward,
          isDeleted: r.is_deleted,
          version: r.version,
          character: r.character,
          createdAt: r.created_at,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
