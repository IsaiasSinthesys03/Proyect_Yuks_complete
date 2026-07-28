// ==========================================
// Fase 22 — CMS: DTOs para gestión de catálogo
// ==========================================

export interface CreateProductDTO {
  categoryIds: string[];
  name: string;
  description?: string | null;
  price: number;
  status?: string;
  hasVirtualReward?: boolean;
}

/** `version` es obligatorio — garantiza OCC en el UPDATE (Q14, WHERE version = N). */
export interface UpdateProductDTO {
  categoryIds?: string[];
  name?: string;
  description?: string | null;
  price?: number;
  status?: string;
  hasVirtualReward?: boolean;
  version: number;
}

export interface CreateVariantDTO {
  productId: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  stock: number;
}

export interface UpdateVariantDTO {
  sku?: string;
  size?: string | null;
  color?: string | null;
}

/**
 * Ajuste de stock por delta — NUNCA un valor absoluto.
 * delta > 0 → incremento, delta < 0 → decremento.
 * La BD aplica `stock + delta` de forma atómica y rechaza si el resultado < 0.
 */
export interface AdjustStockDTO {
  delta: number;
}

export interface CreateCategoryDTO {
  name: string;
}
