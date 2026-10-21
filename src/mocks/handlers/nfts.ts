import { http, HttpResponse } from 'msw'
import { type NftDetail, nftDetailSchema } from '@/shared/contracts/catalog'
import { getDb } from '../db'
import type { NftRecord } from '../db/schema'
import { apiError } from './respond'

export function toNftDetail(record: NftRecord): NftDetail {
  return nftDetailSchema.parse(record)
}

export const nftHandlers = [
  http.get('/api/nfts/:id', ({ params }) => {
    const record = getDb().nfts.findFirst((q) => q.where({ id: String(params.id) }))
    if (!record) return apiError(404, 'not_found', 'NFT não encontrado.')
    return HttpResponse.json(toNftDetail(record))
  }),
]
