import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/domain/apiError'

const maxRetries = 2

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return isApiError(error) && error.isRetryable && failureCount < maxRetries
}

export function retryDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 4_000)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        retryDelay,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
