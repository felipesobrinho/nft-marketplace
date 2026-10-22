import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/shared/ui/lib/utils'

export interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  label: string
  disabled?: boolean
  limitReason?: string
  size?: 'md' | 'sm'
}

const buttonSize = {
  md: 'size-11',
  sm: 'size-9 after:absolute after:-inset-1 after:content-[""]',
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  disabled = false,
  limitReason,
  size = 'md',
}: QuantityStepperProps) {
  const reasonId = useId()
  const locked = max <= min
  const inert = disabled || locked
  const canDecrease = !inert && value > min
  const canIncrease = !inert && value < max

  const buttonClass = cn(
    'relative inline-flex shrink-0 items-center justify-center rounded-full border border-primary text-highlight transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
    buttonSize[size],
  )

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label={label}
        aria-describedby={locked ? reasonId : undefined}
        className="inline-flex items-center gap-4"
      >
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={!canDecrease}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={buttonClass}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <output aria-live="polite" className="min-w-8 text-center text-title font-bold text-foreground">
          {value}
        </output>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={!canIncrease}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={buttonClass}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
      {locked ? (
        <p id={reasonId} className="text-caption text-muted-foreground">
          {limitReason ?? 'Limite de 1 por pedido'}
        </p>
      ) : null}
    </div>
  )
}
