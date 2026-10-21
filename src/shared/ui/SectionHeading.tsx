import type { ReactNode } from 'react'
import { cn } from '@/shared/ui/lib/utils'

export interface SectionHeadingProps {
  level?: 1 | 2
  as?: 'h1' | 'h2' | 'h3'
  title: string
  description?: string
  action?: ReactNode
  align?: 'start' | 'center'
  id?: string
  className?: string
}

export function SectionHeading({
  level = 1,
  as,
  title,
  description,
  action,
  align = 'start',
  id,
  className,
}: SectionHeadingProps) {
  const Heading = as ?? (level === 1 ? 'h2' : 'h3')
  const centered = level === 1 && align === 'center'

  if (centered) {
    return (
      <div className={cn('flex flex-col items-center gap-2 text-center', className)}>
        <Heading id={id} className="text-display-sm font-bold text-foreground">
          {title}
        </Heading>
        {description ? <p className="text-small text-muted-foreground">{description}</p> : null}
        {action}
      </div>
    )
  }

  const headingClass =
    level === 1 ? 'text-title font-bold text-highlight' : 'text-body-lg font-bold text-foreground'

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        level === 1 && 'border-b border-border pb-3',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading id={id} className={headingClass}>
          {title}
        </Heading>
        {description ? <p className="text-small text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
