import type { NetworkId } from '@/shared/contracts/common'
import {
  type AddCartItemRequest,
  cartSchema,
  mergeCartResponseSchema,
  quoteSchema,
} from '@/shared/contracts/commerce'
import { request } from '@/shared/infrastructure/http'

export function fetchCart(signal?: AbortSignal) {
  return request(cartSchema, { url: '/cart', signal })
}

export function addCartItem(body: AddCartItemRequest) {
  return request(cartSchema, { url: '/cart/items', method: 'POST', data: body })
}

export function updateCartItem(itemId: string, quantity: number) {
  return request(cartSchema, { url: `/cart/items/${itemId}`, method: 'PATCH', data: { quantity } })
}

export function removeCartItem(itemId: string) {
  return request(cartSchema, { url: `/cart/items/${itemId}`, method: 'DELETE' })
}

export function applyCoupon(code: string) {
  return request(cartSchema, { url: '/cart/coupon', method: 'PUT', data: { code } })
}

export function removeCoupon() {
  return request(cartSchema, { url: '/cart/coupon', method: 'DELETE' })
}

export function mergeCart(guestCartId: string) {
  return request(mergeCartResponseSchema, { url: '/cart/merge', method: 'POST', data: { guestCartId } })
}

export function createQuote(network: NetworkId, signal?: AbortSignal) {
  return request(quoteSchema, { url: '/quotes', method: 'POST', data: { network }, signal })
}
