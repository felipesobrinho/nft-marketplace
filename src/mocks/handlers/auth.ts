import bcrypt from 'bcryptjs'
import { HttpResponse } from 'msw'
import {
  currentSessionSchema,
  loginRequestSchema,
  registerRequestSchema,
  sessionResponseSchema,
} from '@/shared/contracts/auth'
import { getDb } from '../db'
import type { UserRecord } from '../db/schema'
import { findIdentityConflicts } from '../logic/accounts'
import { getScenario } from '../scenarios/state'
import { apiRoute } from './api'
import { apiError, json, parseBody } from './respond'
import { bearerToken, isResponse, requireAuth, SESSION_TTL_MS } from './session'

const EMAIL_TAKEN = 'Este e-mail já tem cadastro.'
const USERNAME_TAKEN = 'Este nome de usuário já está em uso.'

function sessionUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

async function openSession(user: UserRecord) {
  const now = Date.now()
  const record = await getDb().sessions.create({
    token: crypto.randomUUID(),
    userId: user.id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  })
  return { token: record.token, expiresAt: record.expiresAt, user: sessionUser(user) }
}

export const authHandlers = [
  apiRoute('post', '/auth/register', async ({ request }) => {
    const body = await parseBody(request, registerRequestSchema)
    if (!body.ok) return body.response
    const { username, email, password } = body.data
    const db = getDb()

    if (getScenario() === 'register-conflict') {
      return apiError(409, 'account_conflict', 'Já existe uma conta com esses dados.', {
        fields: { email: EMAIL_TAKEN },
      })
    }

    const conflicts = findIdentityConflicts(db.users.findMany(), { email, username })
    if (conflicts.length > 0) {
      const fields: Record<string, string> = {}
      if (conflicts.includes('email')) fields.email = EMAIL_TAKEN
      if (conflicts.includes('username')) fields.username = USERNAME_TAKEN
      return apiError(409, 'account_conflict', 'Já existe uma conta com esses dados.', { fields })
    }

    const now = new Date().toISOString()
    const user = await db.users.create({
      id: `user-${crypto.randomUUID()}`,
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      displayName: username,
      ensName: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    })
    return json(sessionResponseSchema, await openSession(user), { status: 201 })
  }),

  apiRoute('post', '/auth/login', async ({ request }) => {
    const body = await parseBody(request, loginRequestSchema)
    if (!body.ok) return body.response
    const { email, password } = body.data
    const user = getDb()
      .users.findMany()
      .find((candidate) => candidate.email.toLowerCase() === email)
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !valid) {
      return apiError(401, 'invalid_credentials', 'E-mail ou senha incorretos.')
    }
    return json(sessionResponseSchema, await openSession(user))
  }),

  apiRoute('get', '/auth/session', ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    return json(currentSessionSchema, {
      expiresAt: auth.session.expiresAt,
      user: sessionUser(auth.user),
    })
  }),

  apiRoute('post', '/auth/logout', ({ request }) => {
    const token = bearerToken(request)
    if (token) getDb().sessions.delete((q) => q.where({ token }))
    return new HttpResponse(null, { status: 204 })
  }),
]
