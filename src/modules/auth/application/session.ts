import { queryOptions, useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { SessionUser } from '@/shared/contracts/auth'
import { fetchSession } from '../infrastructure/authApi'
import { sessionStore, type StoredSession } from '../infrastructure/sessionStore'

export const authKeys = {
  session: (userId: string) => ['user', userId, 'session'] as const,
}

export function sessionQuery(userId: string) {
  return queryOptions({
    queryKey: authKeys.session(userId),
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 5 * 60_000,
  })
}

export function useStoredSession(): StoredSession | null {
  return useSyncExternalStore(
    (listener) => sessionStore.subscribe(listener),
    () => sessionStore.get(),
    () => null,
  )
}

export function useCurrentUserId(): string | null {
  return useStoredSession()?.userId ?? null
}

export type SessionState =
  | { status: 'anonymous'; user: null }
  | { status: 'checking'; user: null }
  | { status: 'authenticated'; user: SessionUser }

export function useSession(): SessionState {
  const stored = useStoredSession()
  const query = useQuery({ ...sessionQuery(stored?.userId ?? 'anonimo'), enabled: stored !== null })
  if (!stored) return { status: 'anonymous', user: null }
  if (query.data) return { status: 'authenticated', user: query.data.user }
  return { status: 'checking', user: null }
}
