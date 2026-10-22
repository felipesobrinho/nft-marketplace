import { lazyRouteComponent } from '@tanstack/react-router'

export {
  type CreateOrderInput,
  orderKeys,
  orderQuery,
  PENDING_POLL_MS,
  pendingOrdersQuery,
  useCreateOrder,
  useOrder,
  usePendingOrders,
} from './application/orders'
export { OrderNotFound } from './ui/OrderNotFound'

export const OrderPage = lazyRouteComponent(() => import('./ui/OrderPage'), 'OrderPage')
