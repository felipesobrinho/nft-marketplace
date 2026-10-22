import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/components/ui/label'
import { cn } from '@/shared/ui/lib/utils'

export interface FormFieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

export interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: (control: FormFieldControlProps) => ReactNode
}

export function FormField({ id, label, required, hint, error, className, children }: FormFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  const control: FormFieldControlProps = { id }
  if (describedBy) control['aria-describedby'] = describedBy
  if (error) control['aria-invalid'] = true
  if (required) control['aria-required'] = true

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className="gap-1 text-small font-medium text-foreground">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-coral">
              *
            </span>
            <span className="sr-only">(obrigatório)</span>
          </>
        ) : null}
      </Label>
      {children(control)}
      {hint ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
