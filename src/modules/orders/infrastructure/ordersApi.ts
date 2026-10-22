import {
  type CreateOrderRequest,
  IDEMPOTENCY_HEADER,
  orderListResponseSchema,
  orderSchema,
} from '@/shared/contracts/commerce'
import { request } from '@/shared/infrastructure/http'

export function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  return request(orderSchema, {
    url: '/orders',
    method: 'POST',
    data: body,
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
}

export function fetchOrder(orderId: string, signal?: AbortSignal) {
  return request(orderSchema, { url: `/orders/${orderId}`, signal })
}

export async function fetchPendingOrders(signal?: AbortSignal) {
  const response = await request(orderListResponseSchema, {
    url: '/orders',
    params: { status: 'pending' },
    signal,
  })
  return response.items
}
