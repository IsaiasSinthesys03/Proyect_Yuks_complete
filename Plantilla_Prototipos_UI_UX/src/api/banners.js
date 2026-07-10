import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';

/**
 * useBanners — Banners activos y vigentes del Landing (Fase 39, REQ-FE-01).
 * Endpoint público: GET /api/content/banners (solo devuelve is_active + en ventana).
 * Cada banner: { id, title, imageUrl, linkUrl, position, isActive, startsAt, endsAt }.
 */
export function useBanners() {
  return useQuery({
    queryKey: ['content', 'banners'],
    queryFn: async () => unwrap(await api.get('/api/content/banners')),
  });
}
