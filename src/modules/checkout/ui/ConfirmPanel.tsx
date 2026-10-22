import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/components/ui/button'
import { canPurchase, describeQuoteChange } from '../domain/quoteChanges'
import type { usePurchase } from '../application/purchase'

type Purchase = ReturnType<typeof usePurchase>

interface ConfirmPanelProps {
  purchase: Purchase
  onConfirm: () => void
}

function Alert({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 border-l-4 border-destructive bg-surface-raised p-3 text-small text-foreground"
    >
      <p>{message}</p>
      {children}
    </div>
  )
}

export function ConfirmPanel({ purchase, onConfirm }: ConfirmPanelProps) {
  const { state, quote } = purchase
  const working = state.status === 'checking' || state.status === 'submitting'
  const unavailable = quote.data ? !canPurchase(quote.data) : true
  const blocked =
    state.status === 'blocked' || (state.status !== 'changed' && quote.data !== undefined && unavailable)

  const label =
    state.status === 'checking'
      ? 'Conferindo valores…'
      : state.status === 'submitting'
        ? 'Enviando pedido…'
        : state.status === 'changed'
          ? 'Confirmar com os novos valores'
          : state.status === 'failed' && state.retryable
            ? 'Tentar de novo'
            : 'Confirmar compra'

  return (
    <div className="flex flex-col gap-3">
      {state.status === 'changed' ? (
        <Alert message={state.message}>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {state.changes.map((change, index) => (
              <li key={`${change.kind}-${index}`}>{describeQuoteChange(change)}</li>
            ))}
          </ul>
        </Alert>
      ) : null}
      {state.status === 'blocked' ? (
        <Alert message={state.message}>
          {state.issues.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {state.issues.map((issue) => (
                <li key={`${issue.code}-${issue.cartItemId ?? 'cart'}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}
      {state.status === 'failed' ? <Alert message={state.message} /> : null}
      <Button
        type="button"
        className="w-full"
        disabled={working || blocked || quote.data === undefined}
        aria-busy={working}
        onClick={onConfirm}
      >
        {label}
      </Button>
      {blocked ? (
        <Button asChild variant="link">
          <Link to="/carrinho">Ajustar carrinho</Link>
        </Button>
      ) : null}
    </div>
  )
}
