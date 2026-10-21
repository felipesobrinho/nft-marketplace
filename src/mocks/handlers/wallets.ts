import { delay, HttpResponse } from 'msw'
import {
  connectWalletRequestSchema,
  walletConnectionSchema,
  walletInputSchema,
  walletListResponseSchema,
  walletSchema,
  type WalletRole,
} from '@/shared/contracts/account'
import { getDb } from '../db'
import type { WalletRecord } from '../db/schema'
import { sortWallets } from '../logic/accounts'
import { getScenario } from '../scenarios/state'
import { apiRoute } from './api'
import { apiError, json, parseBody } from './respond'
import { isResponse, requireAuth } from './session'

const ROLE_TAKEN: Record<WalletRole, string> = {
  primary: 'Você já tem uma carteira principal.',
  secondary: 'Você já tem uma carteira secundária.',
}

function forbiddenResponse() {
  return apiError(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
}

function toWallet(record: WalletRecord) {
  return walletSchema.parse(record)
}

function notFound() {
  return apiError(404, 'not_found', 'Carteira não encontrada.')
}

function ownedWallet(userId: string, id: string): WalletRecord | undefined {
  const record = getDb().wallets.findFirst((q) => q.where({ id }))
  return record && record.userId === userId ? record : undefined
}

function roleConflict(userId: string, role: WalletRole, exceptId?: string) {
  const taken = getDb()
    .wallets.findMany((q) => q.where({ userId }))
    .some((wallet) => wallet.role === role && wallet.id !== exceptId)
  if (!taken) return null
  return apiError(409, 'account_conflict', 'Confira os campos destacados.', {
    fields: { role: ROLE_TAKEN[role] },
  })
}

export const walletHandlers = [
  apiRoute('get', '/wallets', ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const records = getDb().wallets.findMany((q) => q.where({ userId: auth.user.id }))
    return json(walletListResponseSchema, { items: sortWallets(records).map(toWallet) })
  }),

  apiRoute('post', '/wallets', async ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, walletInputSchema)
    if (!body.ok) return body.response

    const conflict = roleConflict(auth.user.id, body.data.role)
    if (conflict) return conflict

    const record = await getDb().wallets.create({
      ...body.data,
      id: `wallet-${crypto.randomUUID()}`,
      userId: auth.user.id,
      updatedAt: new Date().toISOString(),
    })
    return json(walletSchema, toWallet(record), { status: 201 })
  }),

  apiRoute<{ id: string }>('patch', '/wallets/:id', async ({ request, params }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, walletInputSchema)
    if (!body.ok) return body.response

    const id = String(params.id)
    if (!ownedWallet(auth.user.id, id)) return notFound()

    const conflict = roleConflict(auth.user.id, body.data.role, id)
    if (conflict) return conflict

    const updatedAt = new Date().toISOString()
    const updated = await getDb().wallets.update((q) => q.where({ id }), {
      data(record) {
        Object.assign(record, body.data, { updatedAt })
      },
    })
    if (!updated) return notFound()
    return json(walletSchema, toWallet(updated))
  }),

  apiRoute<{ id: string }>('post', '/wallets/:id/connection', async ({ request, params }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    const body = await parseBody(request, connectWalletRequestSchema)
    if (!body.ok) return body.response

    const wallet = ownedWallet(auth.user.id, String(params.id))
    if (!wallet) return notFound()

    if (getScenario() === 'wallet-refused') {
      return apiError(409, 'wallet_refused', 'A carteira recusou a conexão. Abra o provedor e tente de novo.')
    }

    await delay(600)
    return json(walletConnectionSchema, {
      walletId: wallet.id,
      provider: body.data.provider,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    })
  }),

  apiRoute<{ id: string }>('delete', '/wallets/:id/connection', ({ request, params }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (getScenario() === 'forbidden') return forbiddenResponse()
    if (!ownedWallet(auth.user.id, String(params.id))) return notFound()
    return new HttpResponse(null, { status: 204 })
  }),
]
