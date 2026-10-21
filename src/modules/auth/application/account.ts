import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LoginRequest, RegisterRequest, SessionResponse } from '@/shared/contracts/auth'
import { login, logout, register } from '../infrastructure/authApi'
import { sessionStore, type StoredSession } from '../infrastructure/sessionStore'
import { authKeys } from './session'

export type SessionEvent =
  | { type: 'signed-in'; session: StoredSession; previousUserId: string | null }
  | { type: 'signed-out'; previousUserId: string | null; reason: 'logout' | 'expired' }

type SessionListener = (event: SessionEvent) => void | Promise<void>

const listeners = new Set<SessionListener>()
let expiring = false

export function onSessionEvent(listener: SessionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function emit(event: SessionEvent): Promise<void> {
  for (const listener of listeners) await listener(event)
}

async function startSession(response: SessionResponse): Promise<StoredSession> {
  const previousUserId = sessionStore.get()?.userId ?? null
  const session: StoredSession = {
    token: response.token,
    expiresAt: response.expiresAt,
    userId: response.user.id,
  }
  sessionStore.set(session)
  sessionStore.clearExpired()
  expiring = false
  await emit({ type: 'signed-in', session, previousUserId })
  return session
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: async (response) => {
      queryClient.setQueryData(authKeys.session(response.user.id), {
        expiresAt: response.expiresAt,
        user: response.user,
      })
      await startSession(response)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterRequest) => register(body),
    onSuccess: async (response) => {
      queryClient.setQueryData(authKeys.session(response.user.id), {
        expiresAt: response.expiresAt,
        user: response.user,
      })
      await startSession(response)
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        return
      }
    },
    onSettled: async () => {
      const previousUserId = sessionStore.get()?.userId ?? null
      sessionStore.clear()
      await emit({ type: 'signed-out', previousUserId, reason: 'logout' })
    },
  })
}

export async function expireSession(): Promise<boolean> {
  if (expiring || !sessionStore.get()) return false
  expiring = true
  const previousUserId = sessionStore.get()?.userId ?? null
  sessionStore.markExpired()
  sessionStore.clear()
  await emit({ type: 'signed-out', previousUserId, reason: 'expired' })
  return true
}
