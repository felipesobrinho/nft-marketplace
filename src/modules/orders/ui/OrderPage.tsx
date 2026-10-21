import { useEffect, useRef, type ReactNode, type Ref } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import { networkNames } from '@/shared/contracts/common'
import { walletTypeNames } from '@/shared/contracts/account'
import type { Order } from '@/shared/contracts/commerce'
import { formatDate, formatDateTime, formatEth, shortenAddress } from '@/shared/domain/format'
import { PurchaseLines } from '@/shared/ui/commerce/PurchaseLines'
import { Button } from '@/shared/ui/components/ui/button'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'
import { useOrder } from '../application/orders'
import { ExplorerDialog } from './ExplorerDialog'
import { OrderSkeleton } from './OrderSkeleton'
import { ReceiptTotals } from './ReceiptTotals'

interface StateProps {
  order: Order
  headingRef: Ref<HTMLHeadingElement>
}

function shortOrderNumber(id: string): string {
  return id
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(-8)
    .toUpperCase()
}

function Heading({ headingRef, children }: { headingRef: Ref<HTMLHeadingElement>; children: ReactNode }) {
  return (
    <h1 ref={headingRef} tabIndex={-1} className="text-title font-bold text-highlight outline-none">
      {children}
    </h1>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-small font-medium break-words text-foreground">{value}</dd>
    </div>
  )
}

function PendingView({ order, headingRef }: StateProps) {
  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex flex-col items-center gap-3 text-center">
        <LoaderCircle
          className="size-12 animate-spin text-highlight motion-reduce:animate-none"
          aria-hidden="true"
        />
        <Heading headingRef={headingRef}>Aguardando confirmação da rede</Heading>
        <p className="text-small text-muted-foreground">
          Pedido {shortOrderNumber(order.id)} enviado em {formatDateTime(order.createdAt)}. A confirmação leva
          alguns segundos; pode recarregar a página que o pedido continua aqui.
        </p>
      </div>
      <PurchaseLines lines={order.receipt.lines} caption="Itens do pedido" />
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
        <span className="text-body font-bold text-foreground">Total</span>
        <span className="text-title font-bold text-highlight">{formatEth(order.receipt.total)}</span>
      </div>
    </div>
  )
}

function RefusedView({ order, headingRef }: StateProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <CircleX className="size-12 text-destructive" aria-hidden="true" />
        <Heading headingRef={headingRef}>Pagamento recusado</Heading>
        {order.reason ? <p className="text-body text-foreground">{order.reason}</p> : null}
        <p className="text-small text-muted-foreground">Seus itens continuam no carrinho.</p>
      </div>
      <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link to="/pagamento">Voltar ao pagamento</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/carrinho">Ver carrinho</Link>
        </Button>
      </div>
    </div>
  )
}

function ConfirmedView({ order, headingRef }: StateProps) {
  const reference = order.transactionRef ?? order.id
  const networkName = networkNames[order.network]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleCheck className="size-12 text-highlight" aria-hidden="true" />
        <Heading headingRef={headingRef}>Seus NFTs agora estão na sua carteira</Heading>
      </div>
      <dl className="grid grid-cols-2 border-y border-border [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-border [&>div:nth-child(odd)]:border-r [&>div:nth-child(odd)]:border-border">
        <SummaryItem label="ID da transação" value={shortenAddress(reference)} />
        <SummaryItem label="Data" value={formatDate(order.updatedAt)} />
        <SummaryItem label="Total" value={formatEth(order.receipt.total)} />
        <SummaryItem
          label="Carteira"
          value={`${walletTypeNames[order.provider]} · ${order.wallet.nickname}`}
        />
      </dl>
      <section aria-labelledby="order-details" className="flex flex-col gap-4">
        <h2 id="order-details" className="text-body-lg font-bold text-foreground">
          Detalhes da transação
        </h2>
        <PurchaseLines lines={order.receipt.lines} caption="Itens da transação" />
        <ReceiptTotals receipt={order.receipt} />
      </section>
      <p className="text-center text-small text-muted-foreground">
        Transação confirmada na {networkName} (simulada). Os NFTs foram registrados na carteira{' '}
        {order.wallet.nickname}.
      </p>
      <div className="flex flex-col items-center gap-2">
        <ExplorerDialog reference={reference} networkName={networkName} />
        <Button asChild variant="ghost">
          <Link to="/">Continuar explorando</Link>
        </Button>
      </div>
    </div>
  )
}

export function OrderPage() {
  const { orderId } = useParams({ from: '/_authenticated/pedidos/$orderId' })
  const query = useOrder(orderId)
  const announce = useAnnounce()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStatus = useRef<Order['status'] | undefined>(undefined)
  const order = query.data
  const status = order?.status

  useEffect(() => {
    const previous = previousStatus.current
    previousStatus.current = status
    if (previous !== 'pending' || !status || status === 'pending') return
    headingRef.current?.focus()
    announce(status === 'confirmed' ? 'Pedido confirmado.' : 'Pagamento recusado.', 'assertive')
  }, [status, announce])

  return (
    <>
      <MobileTopBar title="Pedido" backTo={{ to: '/' }} />
      <div className="md:page md:py-12">
        <div className="relative mx-auto w-full max-w-dialog px-6 pt-6 pb-24 md:rounded-md md:bg-card md:pt-8 md:pb-10">
          {order === undefined && query.isPending ? (
            <OrderSkeleton />
          ) : order === undefined ? (
            <ErrorState
              title="Não foi possível carregar o pedido"
              message="Verifique sua conexão e tente de novo."
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : order.status === 'pending' ? (
            <PendingView order={order} headingRef={headingRef} />
          ) : order.status === 'refused' ? (
            <RefusedView order={order} headingRef={headingRef} />
          ) : (
            <ConfirmedView order={order} headingRef={headingRef} />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 hidden h-1.5 rounded-b-md bg-primary md:block"
          />
        </div>
      </div>
    </>
  )
}
