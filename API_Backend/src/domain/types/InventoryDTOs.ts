/**
 * DTOs del Monitor Global de Inventario y listado admin de catálogo (Fase 35, CMS-FE-16/CMS-FE-06).
 */

/** Estatus dinámico de stock derivado del nivel de inventario. */
export type StockStatus = 'AGOTADO' | 'STOCK_BAJO' | 'ACTIVO';

/** Fila del Monitor Global de Inventario: una variante con su estatus. */
export interface InventoryItemDTO {
  productId: string;
  productName: string;
  isDeleted: boolean;
  variantId: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
  status: StockStatus;
}

/** Fila del listado admin de productos (incluye descontinuados si se pide). */
export interface AdminProductListItemDTO {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  hasVirtualReward: boolean;
  isDeleted: boolean;
  character: string | null;
  createdAt: Date;
}
