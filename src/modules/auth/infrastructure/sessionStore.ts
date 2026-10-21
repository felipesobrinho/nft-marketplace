import { z } from 'zod'
import { readJson, removeKey, writeJson } from '@/shared/infrastructure/storage'

const EXPIRED_KEY = 'session-expired'

const KEY = 'session'

const storedSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.string().min(1),
  userId: z.string().min(1),
})

export type StoredSession = z.infer<typeof storedSessionSchema>

function load(): StoredSession | null {
  const parsed = storedSessionSchema.safeParse(readJson(KEY))
  return parsed.success ? parsed.data : null
}

let current: StoredSession | null | undefined
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

export const sessionStore = {
  get(): StoredSession | null {
    if (current === undefined) current = load()
    return current
  },
  getToken(): string | null {
    return sessionStore.get()?.token ?? null
  },
  set(session: StoredSession): void {
    current = session
    writeJson(KEY, session)
    emit()
  },
  clear(): void {
    current = null
    removeKey(KEY)
    emit()
  },
  markExpired(): void {
    writeJson(EXPIRED_KEY, true, 'session')
  },
  wasExpired(): boolean {
    return readJson<boolean>(EXPIRED_KEY, 'session') === true
  },
  clearExpired(): void {
    removeKey(EXPIRED_KEY, 'session')
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
