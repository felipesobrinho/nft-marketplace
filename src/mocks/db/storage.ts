const DB_VERSION = '1'
const VERSION_KEY = 'kurio:mock-db-version'
const DATA_PREFIX = 'msw/data/storage'
const APP_PREFIX = 'kurio:'

function keysWithPrefix(storage: Storage, prefix: string): string[] {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  return keys
}

export function clearPersistedDb(): void {
  keysWithPrefix(localStorage, DATA_PREFIX).forEach((key) => localStorage.removeItem(key))
}

export function prepareDbStorage(): void {
  if (localStorage.getItem(VERSION_KEY) === DB_VERSION) return
  clearPersistedDb()
  localStorage.setItem(VERSION_KEY, DB_VERSION)
}

export function clearAppStorage(): void {
  keysWithPrefix(localStorage, APP_PREFIX)
    .filter((key) => key !== VERSION_KEY && !key.startsWith('kurio:mock-'))
    .forEach((key) => localStorage.removeItem(key))
  sessionStorage.clear()
}
