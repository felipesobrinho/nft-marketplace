import { Check } from 'lucide-react'
import { cn } from '@/shared/ui/lib/utils'
import { type CheckoutDraft, type CheckoutStep, checkoutSteps, furthestStep, withStep } from '../domain/draft'
import type { DraftChange } from '../application/draft'

export const stepLabels: Record<CheckoutStep, string> = {
  dados: 'Dados do colecionador',
  carteira: 'Carteira e rede',
  revisao: 'Revisão',
}

interface StepIndicatorProps {
  draft: CheckoutDraft
  onChange: (change: DraftChange) => void
}

export function StepIndicator({ draft, onChange }: StepIndicatorProps) {
  const reachable = checkoutSteps.indexOf(furthestStep(draft))
  const current = checkoutSteps.indexOf(draft.step)

  return (
    <nav aria-label="Etapas do pagamento">
      <ol className="grid grid-cols-3 gap-2 md:gap-4">
        {checkoutSteps.map((step, index) => {
          const isCurrent = index === current
          const isDone = index < current
          const canOpen = index <= reachable && !isCurrent
          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-caption font-bold',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isDone && 'border-primary text-highlight',
                  !isCurrent && !isDone && 'border-border text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-caption font-medium md:text-small',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stepLabels[step]}
              </span>
            </>
          )
          const base =
            'flex min-h-11 w-full flex-col items-center justify-start gap-1 border-t-2 pt-3 text-center md:flex-row md:justify-start md:gap-3 md:text-left'
          const tone = isCurrent || isDone ? 'border-primary' : 'border-border'

          return (
            <li key={step} {...(isCurrent ? { 'aria-current': 'step' as const } : {})}>
              {canOpen ? (
                <button
                  type="button"
                  onClick={() => onChange((value) => withStep(value, step))}
                  className={cn(
                    base,
                    tone,
                    'cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className={cn(base, tone)}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
