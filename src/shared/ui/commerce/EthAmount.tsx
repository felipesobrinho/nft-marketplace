import { formatEth } from '@/shared/domain/format'
import { cn } from '@/shared/ui/lib/utils'

export interface EthAmountProps {
  value: string
  previous?: string
  size?: 'body' | 'body-lg' | 'title' | 'heading'
  tone?: 'highlight' | 'foreground'
  className?: string
}

const sizeClass = {
  body: 'text-body',
  'body-lg': 'text-body-lg',
  title: 'text-title',
  heading: 'text-heading',
}

const toneClass = {
  highlight: 'text-highlight',
  foreground: 'text-foreground',
}

export function EthAmount({ value, previous, size = 'body', tone = 'highlight', className }: EthAmountProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', sizeClass[size], className)}>
      <span className={cn('font-bold', toneClass[tone])}>
        {previous ? <span className="sr-only">Preço atual: </span> : null}
        {formatEth(value)}
      </span>
      {previous ? (
        <del className="font-normal text-subtle">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previous)}
        </del>
      ) : null}
    </span>
  )
}
