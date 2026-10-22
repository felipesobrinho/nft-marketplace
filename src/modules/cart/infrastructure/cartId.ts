import { readJson, writeJson } from '@/shared/infrastructure/storage'

const KEY = 'cart-id'
const pattern = /^[0-9a-f-]{36}$/

let cached: string | null = null

export function getCartId(): string {
  if (cached) return cached
  const stored = readJson<string>(KEY)
  if (typeof stored === 'string' && pattern.test(stored)) {
    cached = stored
    return stored
  }
  const created = crypto.randomUUID()
  writeJson(KEY, created)
  cached = created
  return created
}

export function resetCartId(): string {
  cached = null
  writeJson(KEY, crypto.randomUUID())
  return getCartId()
}
