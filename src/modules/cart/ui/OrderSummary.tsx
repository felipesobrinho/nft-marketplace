import { useId } from 'react'
import type { ReactNode } from 'react'
import type { Quote } from '@/shared/contracts/commerce'
import { commonEthDigits, formatEth, formatEthDiscount } from '@/shared/domain/format'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { SectionHeading } from '@/shared/ui/SectionHeading'

export interface OrderSummaryProps {
  title?: string
  quote: Quote | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  children?: ReactNode
  beforeRows?: ReactNode
}

function digits(quote: Quote): number {
  return commonEthDigits(quote.subtotal, quote.discount, quote.networkFee, quote.total)
}

function Row({ label, caption, value }: { label: string; caption?: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex flex-col text-body text-foreground">
        {label}
        {caption ? <span className="text-caption text-subtle">{caption}</span> : null}
      </dt>
      <dd className="text-body text-foreground">{value}</dd>
    </div>
  )
}

export function OrderSummary({
  title = 'Resumo do pedido',
  quote,
  isLoading,
  isError,
  onRetry,
  children,
  beforeRows,
}: OrderSummaryProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-md bg-card p-6">
      <SectionHeading id={titleId} level={1} title={title} />
      {beforeRows}
      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-10" />
          <Skeleton className="h-7" />
        </div>
      ) : isError || !quote ? (
        <div className="[&>[role=alert]]:py-4">
          <ErrorState
            title="Não foi possível calcular o total"
            message="Tente de novo para ver o resumo do pedido."
            onRetry={onRetry}
          />
        </div>
      ) : (
        <>
          {quote.issues.length > 0 ? (
            <div className="flex flex-col gap-2">
              {quote.issues.map((issue) => (
                <p
                  key={`${issue.code}-${issue.cartItemId ?? 'cart'}`}
                  role="alert"
                  className="text-small text-destructive"
                >
                  {issue.message}
                </p>
              ))}
            </div>
          ) : null}
          <dl className="flex flex-col gap-3">
            <Row label="Subtotal" value={formatEth(quote.subtotal, digits(quote))} />
            {quote.coupon ? (
              <Row
                label={`Desconto (${quote.coupon.code})`}
                value={formatEthDiscount(quote.discount, digits(quote))}
              />
            ) : null}
            <Row
              label="Taxa de rede"
              caption="Taxa estimada"
              value={formatEth(quote.networkFee, digits(quote))}
            />
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <dt className="text-body font-bold text-foreground">Total</dt>
              <dd className="text-title font-bold text-highlight">{formatEth(quote.total, digits(quote))}</dd>
            </div>
          </dl>
        </>
      )}
      {children}
    </section>
  )
}
