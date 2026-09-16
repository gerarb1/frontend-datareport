import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos
      retry: (failureCount, error: any) => {
        // No reintentar en 401, 403 o 404
        if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('404')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
