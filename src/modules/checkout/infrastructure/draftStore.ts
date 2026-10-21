import { readJson, removeKey, removeKeysWithPrefix, writeJson } from '@/shared/infrastructure/storage'

export const DRAFT_PREFIX = 'checkout:'

const listeners = new Set<() => void>()
const cache = new Map<string, unknown>()

function keyFor(userId: string): string {
  return `${DRAFT_PREFIX}${userId}`
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

export const draftStore = {
  read(userId: string): unknown {
    const key = keyFor(userId)
    if (!cache.has(key)) cache.set(key, readJson<unknown>(key, 'session'))
    return cache.get(key)
  },
  write(userId: string, value: unknown): void {
    const key = keyFor(userId)
    cache.set(key, value)
    writeJson(key, value, 'session')
    emit()
  },
  clear(userId: string): void {
    const key = keyFor(userId)
    cache.delete(key)
    removeKey(key, 'session')
    emit()
  },
  discardAll(keepUserId: string | null): void {
    removeKeysWithPrefix(DRAFT_PREFIX, 'session', keepUserId ? keyFor(keepUserId) : undefined)
    cache.clear()
    emit()
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
