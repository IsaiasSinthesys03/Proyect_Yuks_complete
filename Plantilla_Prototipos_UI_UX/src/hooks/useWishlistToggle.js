import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToWishlist, removeFromWishlist, useWishlist } from '../api/profile';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const WISHLIST_KEY = ['profile', 'wishlist'];

export function useWishlistToggle(showToast) {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((state) => !!state.user);
  const openAuth = useUiStore((state) => state.openAuth);
  const { data: wishlist = [] } = useWishlist(isLoggedIn);

  const mutation = useMutation({
    mutationFn: ({ product, wasFavorite }) => (
      wasFavorite ? removeFromWishlist(product.id) : addToWishlist(product.id)
    ),
    onMutate: async ({ product, wasFavorite }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const previous = queryClient.getQueryData(WISHLIST_KEY) ?? [];
      queryClient.setQueryData(WISHLIST_KEY, wasFavorite
        ? previous.filter((item) => item.id !== product.id)
        : [...previous.filter((item) => item.id !== product.id), product]);
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(WISHLIST_KEY, context?.previous ?? []);
      showToast(error?.response?.data?.message || 'No se pudo actualizar tu wishlist.', 'error');
    },
    onSuccess: (_data, { wasFavorite }) => {
      showToast(wasFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', 'success');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  });

  const isFavorite = (productId) => wishlist.some((item) => item.id === productId);
  const toggle = (product) => {
    if (!isLoggedIn) {
      openAuth();
      showToast('Inicia sesión para guardar favoritos', 'warning');
      return;
    }
    mutation.mutate({ product, wasFavorite: isFavorite(product.id) });
  };

  return {
    wishlist,
    isFavorite,
    toggle,
    isPending: mutation.isPending,
    pendingProductId: mutation.variables?.product?.id,
  };
}
