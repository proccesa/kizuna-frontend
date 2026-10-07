import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as ApiError).status;
        // No reintentar errores del cliente (4xx).
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
