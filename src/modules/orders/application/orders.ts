import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useCurrentUserId } from '@/modules/auth'
import { cartKeys } from '@/modules/cart'
import { catalogKeys } from '@/modules/catalog'
import { nftKeys } from '@/modules/nft'
import type { CreateOrderRequest, Order } from '@/shared/contracts/commerce'
import { isApiError } from '@/shared/domain/apiError'
import { realtime } from '@/shared/infrastructure/realtime'
import { createOrder, fetchOrder, fetchPendingOrders } from '../infrastructure/ordersApi'

export const PENDING_POLL_MS = 1_000
const MAX_ORDER_RETRIES = 2

export const orderKeys = {
  all: (userId: string) => ['user', userId, 'orders'] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.all(userId), orderId] as const,
  pending: (userId: string) => [...orderKeys.all(userId), 'pending'] as const,
}

export function orderQuery(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: async ({ signal }) => {
      const order = await fetchOrder(orderId, signal)
      realtime.observe('order', order.id, order.version)
      return order
    },
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
}

export function useOrder(orderId: string) {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  const query = useQuery({ ...orderQuery(userId ?? 'anonimo', orderId), enabled: userId !== null })
  const status = query.data?.status

  useEffect(() => {
    if (status !== 'confirmed' || !userId) return
    const owner = { userId }
    void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
    void queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] })
    void queryClient.invalidateQueries({ queryKey: orderKeys.pending(userId) })
    void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  }, [queryClient, status, userId])

  return query
}

export function pendingOrdersQuery(userId: string) {
  return queryOptions({
    queryKey: orderKeys.pending(userId),
    queryFn: ({ signal }) => fetchPendingOrders(signal),
    staleTime: 0,
  })
}

export function usePendingOrders() {
  const userId = useCurrentUserId()
  return useQuery({ ...pendingOrdersQuery(userId ?? 'anonimo'), enabled: userId !== null })
}

export interface CreateOrderInput {
  idempotencyKey: string
  body: CreateOrderRequest
}

export function useCreateOrder() {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ idempotencyKey, body }: CreateOrderInput) => createOrder(body, idempotencyKey),
    retry: (failureCount, error) =>
      isApiError(error) && error.isRetryable && failureCount < MAX_ORDER_RETRIES,
    retryDelay: 500,
    onSuccess: (order: Order) => {
      if (!userId) return
      queryClient.setQueryData(orderKeys.detail(userId, order.id), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.pending(userId) })
    },
  })
}

export function useOrderRealtime(): void {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return
    const offUpdate = realtime.subscribe('order.updated', (event) => {
      const key = orderKeys.detail(userId, event.resource.id)
      queryClient.setQueryData<Order>(key, (order) =>
        order && order.version < event.version
          ? {
              ...order,
              status: event.data.status,
              reason: event.data.reason,
              transactionRef: event.data.transactionRef,
              updatedAt: event.occurredAt,
              version: event.version,
            }
          : order,
      )
      void queryClient.invalidateQueries({ queryKey: orderKeys.pending(userId) })
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all(userId) })
    })
    return () => {
      offUpdate()
      offReconnect()
    }
  }, [queryClient, userId])
}
