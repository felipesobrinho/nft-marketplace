import { lazyRouteComponent } from '@tanstack/react-router'

export { discardCheckoutDrafts, useCheckoutDraft } from './application/draft'
export { useWalletConnection } from './application/connection'
export { type PurchaseState, useCheckoutQuote, usePurchase, useSelectedWallet } from './application/purchase'
export {
  type CheckoutDraft,
  type CheckoutStep,
  checkoutSteps,
  furthestStep,
  withBuyer,
  withProvider,
  withStep,
  withWallet,
} from './domain/draft'
export { blockingIssues, canPurchase, describeQuoteChange, type QuoteChange } from './domain/quoteChanges'

export const CheckoutPage = lazyRouteComponent(() => import('./ui/CheckoutPage'), 'CheckoutPage')
