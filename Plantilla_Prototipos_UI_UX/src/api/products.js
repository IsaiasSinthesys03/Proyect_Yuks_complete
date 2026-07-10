import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';

/**
 * useTopProducts — "Top Ventas" del Landing (Fase 39, REQ-FE-02).
 * Endpoint público cacheado (Redis 1h en backend): GET /api/products/top-sales.
 * Cada producto: { id, name, price, imageUrl, categoryName, ... }.
 */
export function useTopProducts(limit) {
  return useQuery({
    queryKey: ['products', 'top-sales', limit ?? null],
    queryFn: async () => unwrap(await api.get('/api/products/top-sales', { params: limit ? { limit } : {} })),
  });
}

/**
 * useProducts — Explorador del catálogo con filtros combinables (Fase 41, REQ-FE-11/12).
 * GET /api/products?search=&categoryId=&minPrice=&maxPrice=&character=&sortBy=&sortOrder=&page=&limit=
 * Respuesta paginada: { data: ProductWithCategory[], total, page, limit, totalPages }.
 *
 * `placeholderData: keepPreviousData` → al mover un filtro, la grilla conserva
 * los resultados anteriores mientras llega la nueva página (cero parpadeo,
 * cero skeletons nuevos: la maqueta no se rompe).
 */
export function useProducts(filters) {
  // Se eliminan las claves undefined para que la queryKey sea estable.
  const params = Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: async () => unwrap(await api.get('/api/products', { params })),
    placeholderData: keepPreviousData,
  });
}

/**
 * useProductSearch — Omnibox predictivo del Header (Fase 41, REQ-FE-12 V10).
 * Reutiliza GET /api/products?search= con límite corto. El backend aplica la
 * búsqueda FUZZY de la Fase 33 (pg_trgm: "pikchu" encuentra "Pikachu").
 * Solo se activa con ≥3 caracteres; el término llega YA debounced (350ms)
 * desde el Header para no bombardear el backend en cada pulsación.
 */
export function useProductSearch(term) {
  return useQuery({
    queryKey: ['products', 'omnibox', term],
    queryFn: async () => unwrap(await api.get('/api/products', { params: { search: term, limit: 5 } })),
    enabled: (term?.length ?? 0) >= 3,
    placeholderData: keepPreviousData,
  });
}

/**
 * useProductDetail — Vista individual (Fase 41, REQ-FE-31).
 * GET /api/products/:id → { product: ProductWithCategory, variants: ProductVariant[] }.
 * Cada variante trae su STOCK real: { id, sku, size, color, stock }.
 */
export function useProductDetail(productId) {
  return useQuery({
    queryKey: ['products', 'detail', productId],
    queryFn: async () => unwrap(await api.get(`/api/products/${productId}`)),
    enabled: !!productId,
  });
}

/**
 * useCategories — Categorías del catálogo para el sidebar de filtros (Fase 41).
 * GET /api/products/categories → [{ id, name, ... }].
 */
export function useCategories() {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: async () => unwrap(await api.get('/api/products/categories')),
    staleTime: 5 * 60_000, // catálogo de categorías: cambia poco
  });
}
