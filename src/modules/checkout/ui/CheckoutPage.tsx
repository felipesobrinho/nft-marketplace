import { useEffect, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { OrderSummary, useCart, useCartQuote } from '@/modules/cart'
import { usePendingOrders } from '@/modules/orders'
import { formatEth } from '@/shared/domain/format'
import { Button } from '@/shared/ui/components/ui/button'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { PurchaseLines } from '@/shared/ui/commerce/PurchaseLines'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'
import { cn } from '@/shared/ui/lib/utils'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useCheckoutDraft } from '../application/draft'
import { usePurchase, useSelectedWallet } from '../application/purchase'
import { checkoutSteps } from '../domain/draft'
import { BuyerStep } from './BuyerStep'
import { ConfirmPanel } from './ConfirmPanel'
import { ReviewStep } from './ReviewStep'
import { StepIndicator, stepLabels } from './StepIndicator'
import { WalletStep } from './WalletStep'

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="hidden pb-6 text-small text-muted-foreground md:block">
      <ol className="flex items-center gap-2">
        <li>
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to="/" hash="catalogo" className="hover:text-highlight">
            Mercado
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          Pagamento
        </li>
      </ol>
    </nav>
  )
}

function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o pagamento"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="hidden h-[26rem] lg:block" />
    </div>
  )
}

function PendingOrderNotice() {
  const pending = usePendingOrders()
  const first = pending.data?.[0]
  if (!first) return null
  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary bg-surface-raised p-4 text-small text-foreground"
    >
      <span>Você tem um pedido aguardando confirmação.</span>
      <Button asChild variant="link" size="sm">
        <Link to="/pedidos/$orderId" params={{ orderId: first.id }}>
          Ver pedido
        </Link>
      </Button>
    </div>
  )
}

function CheckoutFlow() {
  const navigate = useNavigate()
  const announce = useAnnounce()
  const { draft, update } = useCheckoutDraft()
  const { wallet } = useSelectedWallet()
  const purchase = usePurchase()
  const fallback = useCartQuote('ethereum', purchase.cart.data)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
    announce(
      `Etapa ${checkoutSteps.indexOf(draft.step) + 1} de ${checkoutSteps.length}: ${stepLabels[draft.step]}`,
    )
  }, [announce, draft.step])

  const quote = wallet ? purchase.quote : fallback
  const isReview = draft.step === 'revisao'
  const total = quote.data ? formatEth(quote.data.total) : null

  const confirm = () =>
    void purchase.confirm((order) => {
      void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
    })

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator draft={draft} onChange={update} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0">
          {draft.step === 'dados' ? (
            <BuyerStep draft={draft} onChange={update} headingRef={headingRef} />
          ) : draft.step === 'carteira' ? (
            <WalletStep draft={draft} onChange={update} headingRef={headingRef} totalLabel={total} />
          ) : (
            <ReviewStep draft={draft} onChange={update} headingRef={headingRef} />
          )}
        </div>
        <aside
          aria-label="Resumo da compra"
          className={cn('flex-col gap-4 md:flex lg:sticky lg:top-24', isReview ? 'flex' : 'hidden')}
        >
          <section
            aria-labelledby="checkout-nfts"
            className="flex flex-col gap-4 rounded-md bg-card p-4 sm:p-6"
          >
            <SectionHeading id="checkout-nfts" as="h2" level={1} title="Seus NFTs" />
            {quote.data ? (
              <PurchaseLines lines={quote.data.lines} caption="Seus NFTs" />
            ) : (
              <Skeleton className="h-24" />
            )}
          </section>
          <OrderSummary
            quote={quote.data}
            isLoading={quote.isPending}
            isError={quote.isError}
            onRetry={() => void quote.refetch()}
          >
            {isReview ? <ConfirmPanel purchase={purchase} onConfirm={confirm} /> : null}
          </OrderSummary>
        </aside>
      </div>
    </div>
  )
}

export function CheckoutPage() {
  const cart = useCart()
  const items = cart.data?.items ?? []

  return (
    <>
      <MobileTopBar title="Pagamento" backTo={{ to: '/carrinho' }} />
      <div className="page py-4 md:py-8">
        <Breadcrumb />
        <h1 className="sr-only md:not-sr-only md:pb-6 md:text-display-sm md:font-bold md:text-foreground">
          Pagamento
        </h1>
        <PendingOrderNotice />
        {cart.data === undefined && cart.isPending ? (
          <CheckoutSkeleton />
        ) : cart.data === undefined ? (
          <ErrorState
            title="Não foi possível carregar o carrinho"
            message="Verifique sua conexão e tente de novo."
            onRetry={() => void cart.refetch()}
            isRetrying={cart.isFetching}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="size-6" />}
            title="Seu carrinho está vazio"
            description="Explore o catálogo e escolha as edições que quer colecionar."
            action={
              <Button asChild>
                <Link to="/">Explorar NFTs</Link>
              </Button>
            }
          />
        ) : (
          <CheckoutFlow />
        )}
      </div>
    </>
  )
}
