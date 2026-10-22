import { lazyRouteComponent } from '@tanstack/react-router'
export { cartKeys, cartQuery, useAddToCart, useCart, useCartCount, useCartOwner } from './application/queries'
export { getCartId, resetCartId } from './infrastructure/cartId'
export { useCartChangeNotice, useCartRealtime } from './application/realtime'
export { CartHeaderLink } from './ui/CartHeaderLink'
export { describeAdjustment, mergeGuestCart } from './application/merge'
export {
  quoteQuery,
  requestQuote,
  useApplyCoupon,
  useCartQuote,
  useRemoveCartItem,
  useRemoveCoupon,
  useUpdateCartItem,
} from './application/mutations'
export { OrderSummary } from './ui/OrderSummary'
export type { OrderSummaryProps } from './ui/OrderSummary'

export const CartPage = lazyRouteComponent(() => import('./ui/CartPage'), 'CartPage')
