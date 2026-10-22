import { createFileRoute, notFound } from '@tanstack/react-router'
import { sessionStore } from '@/modules/auth'
import { OrderNotFound, OrderPage, orderQuery } from '@/modules/orders'
import { isApiError } from '@/shared/domain/apiError'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  loader: async ({ context: { queryClient }, params }) => {
    const userId = sessionStore.get()?.userId
    if (!userId) return
    try {
      await queryClient.ensureQueryData(orderQuery(userId, params.orderId))
    } catch (error) {
      if (isApiError(error) && error.is('not_found')) throw notFound()
      throw error
    }
  },
  head: () => ({ meta: [{ title: 'Pedido | Kurio' }] }),
  notFoundComponent: OrderNotFound,
  component: OrderPage,
})
