import bcrypt from 'bcryptjs'
import { HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  changePasswordRequestSchema,
  profileSchema,
  updateAvatarRequestSchema,
  updateProfileRequestSchema,
} from '@/shared/contracts/account'
import { getDb } from '../db'
import type { UserRecord } from '../db/schema'
import { dataUrlByteSize, findIdentityConflicts } from '../logic/accounts'
import { getScenario } from '../scenarios/state'
import { apiRoute } from './api'
import { apiError, json, parseBody } from './respond'
import { isResponse, requireAuth } from './session'

const EMAIL_TAKEN = 'Este e-mail já tem cadastro.'
const USERNAME_TAKEN = 'Este nome de usuário já está em uso.'

function forbiddenResponse() {
  return apiError(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
}

function toProfile(user: UserRecord) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    avatarUrl: user.avatarUrl,
    updatedAt: user.updatedAt,
  }
}

async function patchUser(user: UserRecord, changes: Partial<UserRecord>) {
  const updatedAt = new Date().toISOString()
  const updated = await getDb().users.update((q) => q.where({ id: user.id }), {
    data(record) {
      Object.assign(record, changes, { updatedAt })
    },
  })
  return updated ?? { ...user, ...changes, updatedAt }
}

export const profileHandlers = [
  apiRoute('get', '/profile', ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    return json(profileSchema, toProfile(auth.user))
  }),

  apiRoute('patch', '/profile', async ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, updateProfileRequestSchema)
    if (!body.ok) return body.response
    const { displayName, username, email, ensName } = body.data

    const conflicts = findIdentityConflicts(getDb().users.findMany(), { email, username }, auth.user.id)
    if (conflicts.length > 0) {
      const fields: Record<string, string> = {}
      if (conflicts.includes('email')) fields.email = EMAIL_TAKEN
      if (conflicts.includes('username')) fields.username = USERNAME_TAKEN
      return apiError(409, 'account_conflict', 'Já existe uma conta com esses dados.', { fields })
    }

    const updated = await patchUser(auth.user, { displayName, username, email, ensName })
    return json(profileSchema, toProfile(updated))
  }),

  apiRoute('put', '/profile/avatar', async ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, updateAvatarRequestSchema)
    if (!body.ok) return body.response
    const { dataUrl } = body.data

    if (dataUrl !== null && dataUrlByteSize(dataUrl) > AVATAR_MAX_BYTES) {
      return apiError(422, 'validation_error', 'Confira os campos destacados.', {
        fields: { dataUrl: 'Envie uma imagem de até 1 MB.' },
      })
    }

    const updated = await patchUser(auth.user, { avatarUrl: dataUrl })
    return json(profileSchema, toProfile(updated))
  }),

  apiRoute('post', '/profile/password', async ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, changePasswordRequestSchema)
    if (!body.ok) return body.response
    const { currentPassword, newPassword } = body.data

    const matches = await bcrypt.compare(currentPassword, auth.user.passwordHash)
    if (!matches) {
      return apiError(422, 'validation_error', 'Confira os campos destacados.', {
        fields: { currentPassword: 'Senha atual incorreta.' },
      })
    }
    if (newPassword === currentPassword) {
      return apiError(422, 'validation_error', 'Confira os campos destacados.', {
        fields: { newPassword: 'Use uma senha diferente da atual.' },
      })
    }

    await patchUser(auth.user, { passwordHash: await bcrypt.hash(newPassword, 10) })
    return new HttpResponse(null, { status: 204 })
  }),
]
