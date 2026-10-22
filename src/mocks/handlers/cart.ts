import { HttpResponse } from 'msw'
import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  type Cart,
  cartSchema,
  mergeCartRequestSchema,
  mergeCartResponseSchema,
  updateCartItemRequestSchema,
} from '@/shared/contracts/commerce'
import { getDb } from '../db'
import type { CartRecord } from '../db/schema'
import {
  cartSubtotal,
  couponState,
  editionLimit,
  mergeCartItems,
  priceCart,
  toCoupon,
} from '../logic/commerce'
import { apiRoute } from './api'
import { apiError, json, parseBody } from './respond'
import { bearerToken, isResponse, requireAuth } from './session'

export const CART_HEADER = 'x-cart-id'

const guestCartIdPattern = /^[0-9a-f-]{36}$/

function userCartId(userId: string): string {
  return `cart-${userId}`
}

async function ensureCart(id: string, userId: string | null): Promise<CartRecord> {
  const db = getDb()
  const existing = db.carts.findFirst((q) => q.where({ id }))
  if (existing) return existing
  return db.carts.create({ id, userId, couponCode: null, version: 1, updatedAt: new Date().toISOString() })
}

export async function resolveCart(request: Request): Promise<CartRecord | Response> {
  if (bearerToken(request)) {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    return ensureCart(userCartId(auth.user.id), auth.user.id)
  }
  const guestId = request.headers.get(CART_HEADER)
  if (!guestId || !guestCartIdPattern.test(guestId)) {
    return apiError(400, 'bad_request', 'Carrinho não identificado. Recarregue a página.')
  }
  const existing = getDb().carts.findFirst((q) => q.where({ id: guestId }))
  if (existing && existing.userId !== null) return apiError(404, 'not_found', 'Carrinho não encontrado.')
  return ensureCart(guestId, null)
}

export async function touchCart(cartId: string): Promise<void> {
  await getDb().carts.update((q) => q.where({ id: cartId }), {
    data(cart) {
      cart.version += 1
      cart.updatedAt = new Date().toISOString()
    },
  })
}

export function buildCart(cartId: string): Cart {
  const db = getDb()
  const cart = db.carts.findFirst((q) => q.where({ id: cartId }))
  if (!cart) throw new Error(`Carrinho ${cartId} não existe`)
  const items = priceCart(
    db.cartItems.findMany((q) => q.where({ cartId })),
    db.nfts.all(),
  )
  const couponRecord = cart.couponCode
    ? db.coupons.findFirst((q) => q.where({ code: cart.couponCode ?? '' }))
    : undefined
  const coupon =
    couponRecord && couponState(couponRecord, new Date()) === 'valid' ? toCoupon(couponRecord) : null
  return {
    id: cart.id,
    items,
    coupon,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: cartSubtotal(items),
    version: cart.version,
  }
}

function checkQuantity(nftId: string, editionId: string, quantity: number): Response | null {
  const nft = getDb().nfts.findFirst((q) => q.where({ id: nftId }))
  if (!nft) return apiError(404, 'not_found', 'NFT não encontrado.')
  const limit = editionLimit(nft, editionId)
  if (!limit) return apiError(404, 'not_found', 'Edição não encontrada.')
  if (limit.soldOut) return apiError(409, 'out_of_stock', 'Esta edição esgotou.', { details: { max: 0 } })
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  if (edition && quantity > edition.maxPerOrder) {
    return apiError(409, 'quantity_limit', `Limite de ${edition.maxPerOrder} por pedido para esta edição.`, {
      details: { max: limit.max },
    })
  }
  if (quantity > limit.max) {
    return apiError(409, 'out_of_stock', `Só restam ${limit.max} unidades desta edição.`, {
      details: { max: limit.max },
    })
  }
  return null
}

export const cartHandlers = [
  apiRoute('get', '/cart', async ({ request }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute('post', '/cart/items', async ({ request }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    const body = await parseBody(request, addCartItemRequestSchema)
    if (!body.ok) return body.response
    const { nftId, editionId, quantity } = body.data
    const db = getDb()
    const existing = db.cartItems.findFirst((q) => q.where({ cartId: cart.id, editionId }))
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    const problem = checkQuantity(nftId, editionId, nextQuantity)
    if (problem) return problem
    if (existing) {
      await db.cartItems.update((q) => q.where({ id: existing.id }), {
        data(item) {
          item.quantity = nextQuantity
        },
      })
    } else {
      await db.cartItems.create({
        id: `item-${crypto.randomUUID()}`,
        cartId: cart.id,
        nftId,
        editionId,
        quantity,
        addedAt: new Date().toISOString(),
      })
    }
    await touchCart(cart.id)
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute<{ id: string }>('patch', '/cart/items/:id', async ({ request, params }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    const body = await parseBody(request, updateCartItemRequestSchema)
    if (!body.ok) return body.response
    const db = getDb()
    const item = db.cartItems.findFirst((q) => q.where({ id: params.id, cartId: cart.id }))
    if (!item) return apiError(404, 'not_found', 'Item não está no carrinho.')
    const problem = checkQuantity(item.nftId, item.editionId, body.data.quantity)
    if (problem) return problem
    await db.cartItems.update((q) => q.where({ id: item.id }), {
      data(record) {
        record.quantity = body.data.quantity
      },
    })
    await touchCart(cart.id)
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute<{ id: string }>('delete', '/cart/items/:id', async ({ request, params }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    const db = getDb()
    const item = db.cartItems.findFirst((q) => q.where({ id: params.id, cartId: cart.id }))
    if (!item) return apiError(404, 'not_found', 'Item não está no carrinho.')
    db.cartItems.delete((q) => q.where({ id: item.id }))
    await touchCart(cart.id)
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute('put', '/cart/coupon', async ({ request }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    const body = await parseBody(request, applyCouponRequestSchema)
    if (!body.ok) return body.response
    const coupon = getDb().coupons.findFirst((q) => q.where({ code: body.data.code }))
    const state = couponState(coupon, new Date())
    if (state === 'missing') {
      return apiError(422, 'coupon_invalid', 'Cupom inválido.', { fields: { code: 'Cupom inválido.' } })
    }
    if (state === 'expired') {
      return apiError(422, 'coupon_expired', 'Este cupom expirou.', {
        fields: { code: 'Este cupom expirou.' },
      })
    }
    await getDb().carts.update((q) => q.where({ id: cart.id }), {
      data(record) {
        record.couponCode = body.data.code
      },
    })
    await touchCart(cart.id)
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute('delete', '/cart/coupon', async ({ request }) => {
    const cart = await resolveCart(request)
    if (isResponse(cart)) return cart
    await getDb().carts.update((q) => q.where({ id: cart.id }), {
      data(record) {
        record.couponCode = null
      },
    })
    await touchCart(cart.id)
    return json(cartSchema, buildCart(cart.id))
  }),

  apiRoute('post', '/cart/merge', async ({ request }) => {
    const auth = requireAuth(request)
    if (isResponse(auth)) return auth
    const body = await parseBody(request, mergeCartRequestSchema)
    if (!body.ok) return body.response
    const db = getDb()
    const userCart = await ensureCart(userCartId(auth.user.id), auth.user.id)
    const guestCart = db.carts.findFirst((q) => q.where({ id: body.data.guestCartId }))
    if (!guestCart || guestCart.userId !== null) {
      return json(mergeCartResponseSchema, { cart: buildCart(userCart.id), adjustments: [] })
    }
    const guestItems = db.cartItems.findMany((q) => q.where({ cartId: guestCart.id }))
    const userItems = db.cartItems.findMany((q) => q.where({ cartId: userCart.id }))
    const { quantities, adjustments } = mergeCartItems({
      guest: guestItems,
      user: userItems,
      nfts: db.nfts.all(),
    })
    for (const [editionId, { nftId, quantity }] of quantities) {
      const existing = userItems.find((item) => item.editionId === editionId)
      if (existing) {
        await db.cartItems.update((q) => q.where({ id: existing.id }), {
          data(item) {
            item.quantity = quantity
          },
        })
      } else if (quantity > 0) {
        await db.cartItems.create({
          id: `item-${crypto.randomUUID()}`,
          cartId: userCart.id,
          nftId,
          editionId,
          quantity,
          addedAt: new Date().toISOString(),
        })
      }
    }
    if (!userCart.couponCode && guestCart.couponCode) {
      await db.carts.update((q) => q.where({ id: userCart.id }), {
        data(record) {
          record.couponCode = guestCart.couponCode
        },
      })
    }
    db.cartItems.deleteMany((q) => q.where({ cartId: guestCart.id }))
    db.carts.delete((q) => q.where({ id: guestCart.id }))
    await touchCart(userCart.id)
    return json(mergeCartResponseSchema, { cart: buildCart(userCart.id), adjustments })
  }),
]

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}
