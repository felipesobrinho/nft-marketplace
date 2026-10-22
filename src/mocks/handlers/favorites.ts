import { delay } from 'msw'
import { type NftSummary, nftSummarySchema } from '@/shared/contracts/catalog'
import { favoriteListResponseSchema, favoriteStateSchema } from '@/shared/contracts/commerce'
import { getDb } from '../db'
import { isScenario } from '../scenarios/state'
import { apiRoute } from './api'
import { apiError, json } from './respond'
import { isResponse, requireAuth } from './session'

async function failedFavorite() {
  await delay(800)
  return apiError(503, 'service_unavailable', 'Não foi possível atualizar o favorito. Tente de novo.')
}

export const favoriteHandlers = [
  apiRoute('get', '/favorites', ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    const db = getDb()
    const favorites = db.favorites
      .findMany((q) => q.where({ userId: auth.user.id }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? -1 : 1))
    const items: NftSummary[] = []
    for (const favorite of favorites) {
      const record = db.nfts.findFirst((q) => q.where({ id: favorite.nftId }))
      if (record) items.push(nftSummarySchema.parse(record))
    }
    return json(favoriteListResponseSchema, { items })
  }),
  apiRoute('put', '/favorites/:nftId', async ({ request, params }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (isScenario('favorite-failure')) return failedFavorite()
    const db = getDb()
    const nftId = String(params.nftId)
    const record = db.nfts.findFirst((q) => q.where({ id: nftId }))
    if (!record) return apiError(404, 'not_found', 'NFT não encontrado.')
    const existing = db.favorites.findFirst((q) => q.where({ userId: auth.user.id, nftId }))
    if (!existing) {
      await db.favorites.create({
        id: crypto.randomUUID(),
        userId: auth.user.id,
        nftId,
        createdAt: new Date().toISOString(),
      })
    }
    return json(favoriteStateSchema, { nftId, favorited: true })
  }),
  apiRoute('delete', '/favorites/:nftId', ({ request, params }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    if (isScenario('favorite-failure')) return failedFavorite()
    const db = getDb()
    const nftId = String(params.nftId)
    db.favorites.deleteMany((q) => q.where({ userId: auth.user.id, nftId }))
    return json(favoriteStateSchema, { nftId, favorited: false })
  }),
]
