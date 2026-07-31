import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Analytics del CMS (Fase 48, CMS-FE-02). Todas las llamadas van con el JWT
 * de administrador (instancia `adminApi`).
 *
 * FILTRO REACTIVO: `range` ({start,end} ISO) forma parte de la queryKey —
 * al cambiar el rango de fechas, TanStack Query refetchea SOLO (sin botones
 * de "aplicar"). `keepPreviousData` evita el parpadeo del dashboard.
 */

/** GET /api/admin/analytics/summary?start=&end= → DashboardSummaryDTO. */
export function useAdminSummary(range, enabled = true) {
  const params = {};
  if (range?.start) params.start = range.start;
  if (range?.end) params.end = range.end;
  return useQuery({
    queryKey: ['admin', 'analytics', 'summary', params],
    queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/analytics/summary', { params })),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** GET /api/admin/analytics/sales-over-time?days= → [{date, revenue, orders}]. */
export function useSalesOverTime(days, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'sales-over-time', days],
    queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/analytics/sales-over-time', { params: { days } })),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** GET /api/admin/analytics/top-products?limit= → [{productName, variantSku, unitsSold, revenue}]. */
export function useTopProductsAdmin(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'top-products', limit],
    queryFn: async () => unwrapAdmin(await adminApi.get('/api/admin/analytics/top-products', { params: { limit } })),
    placeholderData: keepPreviousData,
    enabled,
  });
}
