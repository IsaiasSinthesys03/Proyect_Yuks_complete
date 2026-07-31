import { useQuery } from '@tanstack/react-query';
import { adminApi, unwrapAdmin } from '../lib/adminApi';

/** Obtiene todos los videos (Admin) */
export const fetchAdminYoutubeVideos = async () => {
    return unwrapAdmin(await adminApi.get('/api/admin/youtube'));
};

export const useAdminYoutubeVideos = () => {
    return useQuery({
        queryKey: ['admin', 'youtube'],
        queryFn: fetchAdminYoutubeVideos,
    });
};

/** Crea un nuevo video */
export const createYoutubeVideo = async (data) => {
    return unwrapAdmin(await adminApi.post('/api/admin/youtube', data));
};

/** Actualiza un video existente */
export const updateYoutubeVideo = async (id, patch) => {
    return unwrapAdmin(await adminApi.patch(`/api/admin/youtube/${id}`, patch));
};

/** Elimina un video */
export const deleteYoutubeVideo = async (id) => {
    return unwrapAdmin(await adminApi.delete(`/api/admin/youtube/${id}`));
};

/** Reordena videos */
export const reorderYoutubeVideos = async (orders) => {
    return unwrapAdmin(await adminApi.patch('/api/admin/youtube/reorder', { orders }));
};
