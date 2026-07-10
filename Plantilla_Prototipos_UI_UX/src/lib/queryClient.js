import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient central (Fase 38). Estado de servidor (caché, refetch, invalidación)
 * para todos los hooks por dominio que se crearán al conectar las vistas.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
