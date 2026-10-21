import { getDb } from '../db'
import type { SessionRecord, UserRecord } from '../db/schema'
import { getScenario } from '../scenarios/state'
import { apiError } from './respond'

export const SESSION_TTL_MS = 2 * 60 * 60 * 1000

export interface AuthContext {
  user: UserRecord
  session: SessionRecord
}

export function bearerToken(request: Request): string | undefined {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return undefined
  return header.slice('Bearer '.length).trim() || undefined
}

export function findSession(token: string | undefined): AuthContext | null {
  if (!token) return null
  const db = getDb()
  const session = db.sessions.findFirst((q) => q.where({ token }))
  if (!session) return null
  if (Date.parse(session.expiresAt) <= Date.now()) return null
  const user = db.users.findFirst((q) => q.where({ id: session.userId }))
  return user ? { user, session } : null
}

export function userIdForToken(token: string | undefined): string | null {
  return findSession(token)?.user.id ?? null
}

export function optionalAuth(request: Request): AuthContext | null {
  if (getScenario() === 'session-expired') return null
  return findSession(bearerToken(request))
}

export function requireAuth(request: Request): AuthContext | Response {
  const token = bearerToken(request)
  if (!token) return apiError(401, 'unauthenticated', 'Entre na sua conta para continuar.')
  if (getScenario() === 'session-expired') {
    return apiError(401, 'session_expired', 'Sua sessão expirou. Entre de novo para continuar.')
  }
  const db = getDb()
  const session = db.sessions.findFirst((q) => q.where({ token }))
  if (!session) return apiError(401, 'unauthenticated', 'Sessão inválida. Entre de novo.')
  if (Date.parse(session.expiresAt) <= Date.now()) {
    return apiError(401, 'session_expired', 'Sua sessão expirou. Entre de novo para continuar.')
  }
  const user = db.users.findFirst((q) => q.where({ id: session.userId }))
  if (!user) return apiError(401, 'unauthenticated', 'Sessão inválida. Entre de novo.')
  return { user, session }
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response
}
