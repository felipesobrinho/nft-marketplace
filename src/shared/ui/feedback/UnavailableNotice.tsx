import { useState, type ComponentProps, type ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@/shared/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/ui/dialog'

interface UnavailableDialogProps {
  feature: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UnavailableDialog({ feature, open, onOpenChange }: UnavailableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Indisponível nesta demonstração</DialogTitle>
          <DialogDescription>{feature} não faz parte desta demonstração do marketplace.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ButtonVariant = VariantProps<typeof buttonVariants>['variant']

interface UnavailableButtonProps {
  feature: string
  children: ReactNode
  className?: string
  variant?: ButtonVariant
  unstyled?: boolean
  buttonProps?: Omit<ComponentProps<'button'>, 'className' | 'children' | 'onClick' | 'type'>
}

export function UnavailableButton({
  feature,
  children,
  className,
  variant = 'ghost',
  unstyled = false,
  buttonProps,
}: UnavailableButtonProps) {
  const [open, setOpen] = useState(false)
  const trigger = unstyled ? (
    <button
      {...buttonProps}
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  ) : (
    <Button
      {...buttonProps}
      type="button"
      variant={variant}
      className={className}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
    >
      {children}
    </Button>
  )
  return (
    <>
      {trigger}
      <UnavailableDialog feature={feature} open={open} onOpenChange={setOpen} />
    </>
  )
}
