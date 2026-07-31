import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Monitor Global de Inventario (Fase 51, CMS-FE-16/07).
 *
 * `GET /api/admin/inventory?page=&limit=` → paginado de InventoryItemDTO:
 * { productId, productName, isDeleted, variantId, sku, size, color, price,
 *   stock, status } — el `status` lo DERIVA EL BACKEND:
 *   AGOTADO (0) · STOCK_BAJO (≤ umbral) · ACTIVO.
 */
export function useInventory(page = 1, limit = 10, search = '', status = '', enabled = true) {
  return useQuery({
    queryKey: ['admin', 'inventory', { page, limit, search, status }],
    queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/inventory', { params: { page, limit, search, status } })),
    placeholderData: keepPreviousData, // paginación sin parpadeo
    enabled,
  });
}

/**
 * Edición inline de stock (PATCH silencioso, CMS-FE-07).
 * ▓ El endpoint recibe un DELTA (no el valor absoluto) ▓ — la UI calcula
 * `delta = nuevoValor − stockActual`. El backend rechaza deltas que dejen
 * el stock negativo (409 InvalidStockDeltaError).
 */
export async function adjustVariantStock(productId, variantId, delta) {
  return unwrapAdmin(await adminApi.patch(`/api/admin/products/${productId}/variants/${variantId}/stock`, { delta }));
}
