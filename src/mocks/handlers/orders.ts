import { delay } from 'msw'
import { z } from 'zod'
import {
  createOrderRequestSchema,
  IDEMPOTENCY_HEADER,
  type Order,
  orderListResponseSchema,
  orderSchema,
} from '@/shared/contracts/commerce'
import { orderStatusSchema } from '@/shared/contracts/events'
import { parseEth, percentOf, toEthString } from '@/shared/domain/eth'
import { getDb } from '../db'
import type { OrderRecord, QuoteRecord } from '../db/schema'
import { idempotencyDecision, quoteSignature, requestFingerprint } from '../logic/commerce'
import { consumeOnce, getScenario } from '../scenarios/state'
import { changeNft } from '../services/nfts'
import { scheduleSettlement, SETTLEMENT_DELAY_MS } from '../services/orders'
import { createQuote, toQuote } from '../services/quotes'
import { apiRoute } from './api'
import { apiError, json, parseBody } from './respond'
import { type AuthContext, isResponse, requireAuth } from './session'

const ORDER_TIMEOUT_DELAY_MS = 15_000
const PRICE_INCREASE_BPS = 1_000
const idempotencyKeySchema = z.string().trim().min(8).max(100)

function toOrder(record: OrderRecord): Order {
  return orderSchema.parse(record)
}

function guard(request: Request): AuthContext | Response {
  const auth = requireAuth(request)
  if (isResponse(auth)) return auth
  if (getScenario() === 'forbidden') {
    return apiError(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
  }
  return auth
}

async function applyCheckoutScenario(quote: QuoteRecord): Promise<void> {
  const first = quote.lines[0]
  if (!first) return
  if (getScenario() === 'price-change-at-checkout' && consumeOnce('price-change-at-checkout')) {
    const current = parseEth(first.unitPrice)
    await changeNft(first.nftId, {
      editionId: first.editionId,
      price: toEthString(current + percentOf(current, PRICE_INCREASE_BPS)),
    })
  }
  if (getScenario() === 'sold-out-at-checkout' && consumeOnce('sold-out-at-checkout')) {
    await changeNft(first.nftId, { editionId: first.editionId, available: 0 })
  }
}

function revalidationError(fresh: QuoteRecord, stored: QuoteRecord): Response | null {
  const details = { quote: toQuote(fresh) }
  if (fresh.lines.length === 0) {
    return apiError(409, 'out_of_stock', 'O carrinho não tem itens disponíveis.', { details })
  }
  if (fresh.issues.some((issue) => issue.code === 'out_of_stock' || issue.code === 'quantity_limit')) {
    return apiError(
      409,
      'out_of_stock',
      'Um item do pedido esgotou ou passou do limite. Confira e confirme de novo.',
      { details },
    )
  }
  if (Date.parse(stored.expiresAt) <= Date.now()) {
    return apiError(409, 'quote_expired', 'A cotação expirou. Confira os valores e confirme de novo.', {
      details,
    })
  }
  if (quoteSignature(fresh) !== quoteSignature(stored)) {
    return apiError(
      409,
      'quote_outdated',
      'Os valores mudaram desde a revisão. Confira e confirme de novo.',
      {
        details,
      },
    )
  }
  return null
}

export const orderHandlers = [
  apiRoute('post', '/orders', async ({ request }) => {
    const auth = guard(request)
    if (isResponse(auth)) return auth
    const key = idempotencyKeySchema.safeParse(request.headers.get(IDEMPOTENCY_HEADER))
    if (!key.success) {
      return apiError(400, 'bad_request', `Envie o cabeçalho ${IDEMPOTENCY_HEADER} com a chave da tentativa.`)
    }
    const body = await parseBody(request, createOrderRequestSchema)
    if (!body.ok) return body.response
    const db = getDb()
    const fingerprint = requestFingerprint(body.data)
    const existing = db.orders.findFirst((q) => q.where({ userId: auth.user.id, idempotencyKey: key.data }))
    const decision = idempotencyDecision(existing, fingerprint)
    if (decision === 'replay' && existing) return json(orderSchema, toOrder(existing))
    if (decision === 'conflict') {
      return apiError(
        409,
        'idempotency_conflict',
        'Esta tentativa já foi usada com outros dados. Revise o pedido de novo.',
      )
    }

    const { quoteId, walletId, network, provider, buyer } = body.data
    const cartId = `cart-${auth.user.id}`
    const quote = db.quotes.findFirst((q) => q.where({ id: quoteId }))
    if (!quote || quote.cartId !== cartId) {
      return apiError(404, 'not_found', 'Cotação não encontrada. Revise o pedido.')
    }
    const wallet = db.wallets.findFirst((q) => q.where({ id: walletId, userId: auth.user.id }))
    if (!wallet) return apiError(404, 'not_found', 'Carteira não encontrada.')
    if (wallet.network !== network || quote.network !== network) {
      return apiError(422, 'validation_error', 'A rede não confere com a carteira escolhida.', {
        fields: { network: 'Escolha a mesma rede da carteira.' },
      })
    }

    await applyCheckoutScenario(quote)
    const fresh = await createQuote(cartId, network)
    const problem = revalidationError(fresh, quote)
    if (problem) return problem

    const now = new Date()
    const order = await db.orders.create({
      id: `ord-${crypto.randomUUID()}`,
      status: 'pending',
      reason: null,
      transactionRef: null,
      network,
      provider,
      wallet: { id: wallet.id, nickname: wallet.nickname, address: wallet.address },
      buyer,
      receipt: {
        lines: quote.lines,
        coupon: quote.coupon,
        subtotal: quote.subtotal,
        discount: quote.discount,
        networkFee: quote.networkFee,
        total: quote.total,
      },
      quoteId: quote.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      userId: auth.user.id,
      cartId,
      idempotencyKey: key.data,
      requestHash: fingerprint,
      settlesAt: new Date(now.getTime() + SETTLEMENT_DELAY_MS).toISOString(),
      outcome: getScenario() === 'payment-refused' ? 'refused' : 'confirmed',
    })
    scheduleSettlement(order)
    if (getScenario() === 'order-timeout' && consumeOnce('order-timeout')) await delay(ORDER_TIMEOUT_DELAY_MS)
    return json(orderSchema, toOrder(order), { status: 201 })
  }),

  apiRoute<{ id: string }>('get', '/orders/:id', ({ request, params }) => {
    const auth = guard(request)
    if (isResponse(auth)) return auth
    const order = getDb().orders.findFirst((q) => q.where({ id: params.id, userId: auth.user.id }))
    if (!order) return apiError(404, 'not_found', 'Pedido não encontrado.')
    return json(orderSchema, toOrder(order))
  }),

  apiRoute('get', '/orders', ({ request }) => {
    const auth = guard(request)
    if (isResponse(auth)) return auth
    const status = orderStatusSchema.safeParse(new URL(request.url).searchParams.get('status'))
    const orders = getDb()
      .orders.findMany((q) => q.where({ userId: auth.user.id }))
      .filter((order) => !status.success || order.status === status.data)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return json(orderListResponseSchema, { items: orders.map(toOrder) })
  }),
]
