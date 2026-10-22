import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { quoteQuery, requestQuote, useCart, useCartOwner } from '@/modules/cart'
import { type CreateOrderInput, useCreateOrder } from '@/modules/orders'
import { useWallets } from '@/modules/wallets'
import type { Wallet, WalletType } from '@/shared/contracts/account'
import {
  type Buyer,
  type Order,
  type Quote,
  type QuoteIssue,
  quoteOutdatedDetailsSchema,
} from '@/shared/contracts/commerce'
import { errorMessage, isApiError } from '@/shared/domain/apiError'
import { attemptFor, type CheckoutAttempt, isConnected, withAttempt } from '../domain/draft'
import { blockingIssues, canPurchase, compareQuotes, type QuoteChange } from '../domain/quoteChanges'
import { useCheckoutDraft } from './draft'

export type PurchaseState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'submitting' }
  | { status: 'changed'; changes: QuoteChange[]; message: string }
  | { status: 'blocked'; issues: QuoteIssue[]; message: string }
  | { status: 'failed'; message: string; retryable: boolean }

const quoteRejections = new Set(['quote_outdated', 'quote_expired', 'out_of_stock'])

function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function useSelectedWallet(): { wallet: Wallet | null; wallets: ReturnType<typeof useWallets> } {
  const { draft } = useCheckoutDraft()
  const wallets = useWallets()
  const wallet = wallets.data?.find((item) => item.id === draft.walletId) ?? null
  return { wallet, wallets }
}

export function useCheckoutQuote() {
  const owner = useCartOwner()
  const cart = useCart()
  const { wallet } = useSelectedWallet()
  const network = wallet?.network ?? null
  const hasItems = (cart.data?.items.length ?? 0) > 0
  const query = useQuery({
    ...quoteQuery(owner, network ?? 'ethereum', cart.data?.version ?? 0),
    enabled: network !== null && hasItems,
  })
  return { cart, quote: query, network }
}

export function usePurchase() {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const { draft, update } = useCheckoutDraft()
  const { wallet } = useSelectedWallet()
  const { cart, quote } = useCheckoutQuote()
  const createOrder = useCreateOrder()
  const [state, setState] = useState<PurchaseState>({ status: 'idle' })
  const inFlight = useRef(false)
  const cartIsEmpty = cart.data !== undefined && cart.data.items.length === 0
  const reviewedQuoteId = quote.data?.id ?? null

  useEffect(() => {
    if (cartIsEmpty && draft.attempt) update((current) => withAttempt(current, null))
  }, [cartIsEmpty, draft.attempt, update])

  useEffect(() => {
    if (draft.step !== 'revisao' || !reviewedQuoteId || cartIsEmpty) return
    if (draft.attempt?.sent || draft.attempt?.quoteId === reviewedQuoteId) return
    update((current) => withAttempt(current, attemptFor(current, reviewedQuoteId, newIdempotencyKey)))
  }, [cartIsEmpty, draft.attempt, draft.step, reviewedQuoteId, update])

  const replaceQuote = useCallback(
    (fresh: Quote) => {
      if (!cart.data) return
      queryClient.setQueryData(quoteQuery(owner, fresh.network, cart.data.version).queryKey, fresh)
    },
    [cart.data, owner, queryClient],
  )

  const showFreshQuote = useCallback(
    (reviewed: Quote, fresh: Quote, message: string) => {
      replaceQuote(fresh)
      if (!canPurchase(fresh)) {
        update((current) => withAttempt(current, null))
        setState({ status: 'blocked', issues: blockingIssues(fresh), message })
        return
      }
      update((current) =>
        withAttempt(current, attemptFor(withAttempt(current, null), fresh.id, newIdempotencyKey)),
      )
      setState({ status: 'changed', changes: compareQuotes(reviewed, fresh), message })
    },
    [replaceQuote, update],
  )

  const submit = useCallback(
    async (
      reviewed: Quote,
      wallet: Wallet,
      buyer: Buyer,
      provider: WalletType,
      onCreated: (order: Order) => void,
    ) => {
      let attempt: CheckoutAttempt = draft.attempt?.sent
        ? draft.attempt
        : attemptFor(draft, reviewed.id, newIdempotencyKey)

      if (!attempt.sent) {
        setState({ status: 'checking' })
        let fresh: Quote
        try {
          fresh = await requestQuote(wallet.network)
        } catch (error) {
          setState({ status: 'failed', message: errorMessage(error), retryable: true })
          return
        }
        if (!canPurchase(fresh) || compareQuotes(reviewed, fresh).length > 0) {
          showFreshQuote(reviewed, fresh, 'Os valores mudaram desde a revisão. Confira e confirme de novo.')
          return
        }
        attempt = { ...attempt, sent: true }
        const sent = attempt
        update((current) => withAttempt(current, sent))
      }

      setState({ status: 'submitting' })
      const input: CreateOrderInput = {
        idempotencyKey: attempt.key,
        body: { quoteId: attempt.quoteId, walletId: wallet.id, network: wallet.network, provider, buyer },
      }
      try {
        const order = await createOrder.mutateAsync(input)
        update((current) => withAttempt(current, null))
        setState({ status: 'idle' })
        onCreated(order)
      } catch (error) {
        if (isApiError(error) && error.status === 409 && error.code && quoteRejections.has(error.code)) {
          const details = quoteOutdatedDetailsSchema.safeParse(error.details)
          if (details.success) {
            showFreshQuote(reviewed, details.data.quote, error.message)
            return
          }
        }
        const retryable = isApiError(error) && error.isRetryable
        if (!retryable) update((current) => withAttempt(current, null))
        setState({ status: 'failed', message: errorMessage(error), retryable })
      }
    },
    [createOrder, draft, showFreshQuote, update],
  )

  const confirm = useCallback(
    async (onCreated: (order: Order) => void) => {
      const reviewed = quote.data
      const { buyer, provider } = draft
      if (!reviewed || !wallet || !buyer || !provider || !isConnected(draft)) return
      if (inFlight.current) return
      inFlight.current = true
      try {
        await submit(reviewed, wallet, buyer, provider, onCreated)
      } finally {
        inFlight.current = false
      }
    },
    [draft, quote.data, submit, wallet],
  )

  const acknowledge = useCallback(() => setState({ status: 'idle' }), [])

  return { state, confirm, acknowledge, quote, cart }
}
