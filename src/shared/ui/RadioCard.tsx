import { type ComponentProps, type ReactNode, useId } from 'react'
import { Label } from '@/shared/ui/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/components/ui/radio-group'
import { cn } from '@/shared/ui/lib/utils'

export interface RadioCardProps {
  value: string
  title: string
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
  className?: string
}

export function RadioCard({ value, title, description, icon, disabled, className }: RadioCardProps) {
  const id = useId()

  return (
    <Label
      htmlFor={id}
      className={cn(
        'min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-4 leading-normal font-normal transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-surface-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-disabled:cursor-not-allowed has-disabled:opacity-50',
        className,
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5" />
      {icon ? (
        <span aria-hidden="true" className="shrink-0 text-highlight">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body font-bold text-foreground">{title}</span>
        {description ? <span className="text-small text-muted-foreground">{description}</span> : null}
      </span>
    </Label>
  )
}

export function RadioCardGroup({ className, ...props }: ComponentProps<typeof RadioGroup>) {
  return <RadioGroup className={cn('grid gap-3', className)} {...props} />
}
