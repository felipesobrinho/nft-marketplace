export interface IdentityRecord {
  id: string
  email: string
  username: string
}

export interface IdentityQuery {
  email: string
  username: string
}

export type IdentityField = 'email' | 'username'

export interface SortableWallet {
  role: 'primary' | 'secondary'
  nickname: string
}

export function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase()
}

export function dataUrlByteSize(dataUrl: string): number {
  const separator = dataUrl.indexOf(',')
  const payload = separator === -1 ? dataUrl : dataUrl.slice(separator + 1)
  if (payload.length === 0) return 0
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  return Math.floor((payload.length * 3) / 4) - padding
}

export function findIdentityConflicts(
  users: readonly IdentityRecord[],
  query: IdentityQuery,
  exceptUserId?: string,
): IdentityField[] {
  const email = normalizeIdentity(query.email)
  const username = normalizeIdentity(query.username)
  const conflicts = new Set<IdentityField>()
  for (const user of users) {
    if (user.id === exceptUserId) continue
    if (normalizeIdentity(user.email) === email) conflicts.add('email')
    if (normalizeIdentity(user.username) === username) conflicts.add('username')
  }
  return (['email', 'username'] as const).filter((field) => conflicts.has(field))
}

export function sortWallets<T extends SortableWallet>(wallets: readonly T[]): T[] {
  return [...wallets].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'primary' ? -1 : 1
    return a.nickname.localeCompare(b.nickname, 'pt-BR')
  })
}
