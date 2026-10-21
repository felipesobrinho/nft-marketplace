import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { ethAmountSchema } from '@/shared/contracts/common'
import { getDb, resetDb } from '../db'
import { apiError, parseBody } from '../handlers/respond'
import { clearEventLog, connectionCount, deliver, disconnectAll, lastEvent } from '../realtime/hub'
import { isScenarioId, scenarioIds, scenarios } from '../scenarios/registry'
import { getScenario, setScenario } from '../scenarios/state'
import { changeNft } from '../services/nfts'
import { settleOrder } from '../services/orders'

const nftUpdateSchema = z.object({
  nftId: z.string().min(1),
  price: ethAmountSchema.optional(),
  editionId: z.string().min(1).optional(),
  available: z.number().int().min(0).optional(),
})

const orderUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['confirmed', 'refused']),
  reason: z.string().min(1).optional(),
})

const replaySchema = z.object({
  type: z.enum(['nft.updated', 'order.updated']).optional(),
  mode: z.enum(['duplicate', 'stale']),
})

const resetSchema = z.object({ scenario: z.string().optional() })
const scenarioSchema = z.object({ id: z.string().refine(isScenarioId, 'Cenário desconhecido') })

export const controlHandlers = [
  http.post('/__mock/reset', async ({ request }) => {
    const body = await parseBody(request, resetSchema)
    await resetDb()
    clearEventLog()
    const requested = body.ok ? body.data.scenario : undefined
    setScenario(isScenarioId(requested) ? requested : 'default')
    return HttpResponse.json({ ok: true, scenario: getScenario() })
  }),

  http.get('/__mock/scenario', () =>
    HttpResponse.json({
      current: getScenario(),
      available: scenarioIds.map((id) => scenarios[id]),
    }),
  ),

  http.put('/__mock/scenario', async ({ request }) => {
    const body = await parseBody(request, scenarioSchema)
    if (!body.ok) return body.response
    const id = body.data.id
    if (!isScenarioId(id)) return apiError(422, 'validation_error', 'Cenário desconhecido.')
    setScenario(id)
    return HttpResponse.json({ current: id })
  }),

  http.post('/__mock/events/nft-updated', async ({ request }) => {
    const body = await parseBody(request, nftUpdateSchema)
    if (!body.ok) return body.response
    const { nftId, ...change } = body.data
    const result = await changeNft(nftId, change)
    if (!result) return apiError(404, 'not_found', 'NFT não encontrado.')
    return HttpResponse.json({
      event: lastEvent((event) => event.type === 'nft.updated'),
      delivered: result.delivered,
    })
  }),

  http.post('/__mock/events/order-updated', async ({ request }) => {
    const body = await parseBody(request, orderUpdateSchema)
    if (!body.ok) return body.response
    const { orderId, status, reason } = body.data
    const order = await settleOrder(orderId, reason ? { status, reason } : { status })
    if (!order) return apiError(404, 'not_found', 'Pedido não encontrado.')
    return HttpResponse.json({ order: { id: order.id, status: order.status, version: order.version } })
  }),

  http.post('/__mock/events/replay', async ({ request }) => {
    const body = await parseBody(request, replaySchema)
    if (!body.ok) return body.response
    const { type, mode } = body.data
    const original = lastEvent((event) => type === undefined || event.type === type)
    if (!original) return apiError(404, 'not_found', 'Nenhum evento emitido ainda.')
    const replayed =
      mode === 'duplicate'
        ? original
        : { ...original, eventId: crypto.randomUUID(), version: Math.max(1, original.version - 1) }
    return HttpResponse.json({ event: replayed, delivered: deliver(replayed) })
  }),

  http.post('/__mock/orders/settle-pending', async () => {
    const pending = getDb().orders.findMany((q) => q.where({ status: 'pending' }))
    for (const order of pending) await settleOrder(order.id)
    return HttpResponse.json({ settled: pending.length })
  }),

  http.get('/__mock/realtime', () => HttpResponse.json({ connections: connectionCount() })),

  http.post('/__mock/realtime/disconnect', () => HttpResponse.json({ closed: disconnectAll() })),
]
