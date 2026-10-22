import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { ethAmountSchema } from '@/shared/contracts/common'
import { getDb, resetDb } from '../db'
import { apiError } from '../handlers/respond'
import { nftUpdatedEvent } from '../realtime/events'
import { connectionCount, disconnectAll, publish } from '../realtime/hub'

const nftUpdateSchema = z.object({
  nftId: z.string().min(1),
  price: ethAmountSchema.optional(),
  editionId: z.string().min(1).optional(),
  available: z.number().int().min(0).optional(),
})

export const controlHandlers = [
  http.post('/__mock/reset', async () => {
    await resetDb()
    return HttpResponse.json({ ok: true })
  }),

  http.post('/__mock/events/nft-updated', async ({ request }) => {
    const parsed = nftUpdateSchema.safeParse(await request.json())
    if (!parsed.success) return apiError(422, 'validation_error', 'Corpo inválido para nft-updated.')
    const { nftId, price, editionId, available } = parsed.data
    const db = getDb()
    const current = db.nfts.findFirst((q) => q.where({ id: nftId }))
    if (!current) return apiError(404, 'not_found', 'NFT não encontrado.')
    const updated = await db.nfts.update((q) => q.where({ id: nftId }), {
      data(record) {
        const targetId = editionId ?? record.editions[0]?.id
        for (const edition of record.editions) {
          if (edition.id !== targetId) continue
          if (price !== undefined) edition.price = price
          if (available !== undefined) {
            edition.available = available
            edition.status = available === 0 ? 'sold_out' : 'available'
          }
        }
        if (price !== undefined) {
          record.previousPrice = record.price
          record.price = price
        }
        record.availability = record.editions.some((edition) => edition.status === 'available')
          ? 'available'
          : 'sold_out'
        record.version += 1
      },
    })
    if (!updated) return apiError(404, 'not_found', 'NFT não encontrado.')
    const event = nftUpdatedEvent(updated)
    const delivered = publish(event)
    return HttpResponse.json({ event, delivered })
  }),

  http.get('/__mock/realtime', () => HttpResponse.json({ connections: connectionCount() })),

  http.post('/__mock/realtime/disconnect', () => {
    return HttpResponse.json({ closed: disconnectAll() })
  }),
]
