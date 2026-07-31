import { useQuery } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/**
 * Media Manager — Banners del Hero (Fase 51, CMS-FE-03).
 *
 * CRUD real contra `/api/admin/banners`:
 *   { id, title, imageUrl, linkUrl, position, isActive, startsAt, endsAt }.
 * El storefront solo muestra los `isActive` vigentes (GET /api/content/banners).
 *
 * ▓ NOTA (upload) ▓ El pipeline S3/WEBP del backend existe
 * (`POST /api/admin/products/:id/image`) pero responde 503 sin credenciales
 * S3 configuradas — por ahora los banners usan URL DIRECTA de imagen
 * (permitido por directiva); la subida multipart se conectará al configurar S3.
 */
export function useAdminBanners(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      const res = unwrapAdmin(await adminApi.get('/api/admin/banners'));
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled,
  });
}

/** POST /api/admin/banners → 201. `imageUrl` es obligatorio (URL directa por ahora). */
export async function createBanner({ title, imageUrl, linkUrl, position, isActive, tag, description, videoUrl, accentColor, buttonText }) {
  return unwrapAdmin(await adminApi.post('/api/admin/banners', { 
    title, imageUrl, linkUrl: linkUrl || null, position, isActive, tag, description, videoUrl, accentColor, buttonText 
  }));
}

/** PUT /api/admin/banners/:id — actualización parcial (toggle isActive, reorden position…). */
export async function updateBanner(id, patch) {
  return unwrapAdmin(await adminApi.put(`/api/admin/banners/${id}`, patch));
}

export async function deleteBanner(id) {
  return unwrapAdmin(await adminApi.delete(`/api/admin/banners/${id}`));
}

/**
 * POST /api/admin/banners/:id/image
 * Subida multipart a Cloudflare R2 / S3.
 */
export async function uploadBannerImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);
  return unwrapAdmin(
    await adminApi.post(`/api/admin/banners/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
}

/**
 * POST /api/admin/banners/:id/video
 * Subida multipart de video o imagen de fondo a Cloudflare R2 / S3.
 */
export async function uploadBannerVideo(id, file) {
  const formData = new FormData();
  formData.append('video', file);
  return unwrapAdmin(
    await adminApi.post(`/api/admin/banners/${id}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );
}
