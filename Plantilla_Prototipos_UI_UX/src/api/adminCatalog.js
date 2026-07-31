import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Catálogo del CMS (Fase 50, CMS-FE-06/07).
 *
 * ▓ OCC — CONTROL DE CONCURRENCIA OPTIMISTA (innegociable) ▓
 * Cada `PUT /api/admin/products/:id` DEBE llevar el campo `version` que se
 * cargó al abrir el formulario. Si otro admin guardó antes, el backend
 * responde **409 Conflict** (`OptimisticConcurrencyError`) y la UI debe
 * avisar SIN sobrescribir a ciegas.
 */

/** GET /api/admin/products?page=&limit=&includeDeleted= → paginado (incluye descontinuados). */
export function useAdminProducts(page = 1, limit = 20, search = '', status = 'ALL', enabled = true) {
  const includeDeleted = status === 'ARCHIVED' || status === 'ALL';
  return useQuery({
    queryKey: ['admin', 'products', { page, limit, search, status, includeDeleted }],
    queryFn: async () => {
      const pageResult = unwrapAdmin(await adminApi.get('/api/admin/products', { 
        params: { page, limit, includeDeleted, search, status } 
      }));
      return pageResult; // Returning full paginated response object { data, total, page, limit, totalPages }
    },
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** GET /api/admin/products/:id → Obtiene el detalle (producto y variantes) para el form admin. */
export async function getAdminProductDetail(id) {
  return unwrapAdmin(await adminApi.get(`/api/admin/products/${id}`));
}

/** POST /api/admin/products → 201 Product (con version inicial). */
export async function createProduct({ categoryIds, name, description, price, status, hasVirtualReward }) {
  return unwrapAdmin(await adminApi.post('/api/admin/products', { categoryIds, name, description, price, status, hasVirtualReward }));
}

/**
 * PUT /api/admin/products/:id — SIEMPRE con `version` (OCC).
 * 409 → otro admin modificó el producto: recargar antes de reintentar.
 */
export async function updateProduct(id, { categoryIds, name, description, price, status, hasVirtualReward, version }) {
  return unwrapAdmin(await adminApi.put(`/api/admin/products/${id}`, { categoryIds, name, description, price, status, hasVirtualReward, version }));
}

/** DELETE /api/admin/products/:id → 204 (soft delete: descontinuado, no borrado). */
export async function softDeleteProduct(id) {
  return unwrapAdmin(await adminApi.delete(`/api/admin/products/${id}`));
}

/** POST /api/admin/products/:id/variants {sku, size?, color?, stock} → 201 · 409 SKU duplicado. */
export async function createVariant(productId, { sku, size, color, stock }) {
  return unwrapAdmin(await adminApi.post(`/api/admin/products/${productId}/variants`, { sku, size, color, stock }));
}

/** PATCH /api/admin/products/:id/variants/:variantId {sku?, size?, color?} (el stock vive en F51). */
export async function updateVariant(productId, variantId, { sku, size, color }) {
  return unwrapAdmin(await adminApi.patch(`/api/admin/products/${productId}/variants/${variantId}`, { sku, size, color }));
}

/** PUT /api/admin/products/:id/variants/:variantId/absolute-stock {stock} */
export async function setAbsoluteVariantStock(productId, variantId, stock) {
  return unwrapAdmin(await adminApi.put(`/api/admin/products/${productId}/variants/${variantId}/absolute-stock`, { stock }));
}

/**
 * POST /api/admin/categories {name} — FIND-OR-CREATE idempotente: si la
 * categoría ya existe la devuelve; si no, la crea al vuelo (selector creatable).
 */
export async function findOrCreateCategory(name) {
  return unwrapAdmin(await adminApi.post('/api/admin/categories', { name }));
}

/**
 * POST /api/admin/products/:id/image
 * Subida multipart a Cloudflare R2 / S3.
 */
export async function uploadProductImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);
  return unwrapAdmin(
    await adminApi.post(`/api/admin/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
}
/**
 * POST /api/admin/products/:id/gallery
 * Sube una imagen a la galería secundaria.
 */
export async function uploadProductGalleryImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);
  return unwrapAdmin(
    await adminApi.post(`/api/admin/products/${id}/gallery`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
}

/**
 * DELETE /api/admin/products/:id/gallery
 * Elimina una imagen de la galería secundaria.
 */
export async function deleteProductGalleryImage(id, url) {
  return unwrapAdmin(
    await adminApi.delete(`/api/admin/products/${id}/gallery`, {
      data: { url }
    })
  );
}
