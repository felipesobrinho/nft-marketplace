import type { ComponentProps, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, type buttonVariants } from '@/shared/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/components/ui/dialog'

interface UnavailableDialogProps {
  feature: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function UnavailableContent({ feature }: { feature: string }) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Indisponível nesta demonstração</DialogTitle>
        <DialogDescription>{feature} não faz parte desta demonstração do marketplace.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button">Entendi</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

export function UnavailableDialog({ feature, open, onOpenChange }: UnavailableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <UnavailableContent feature={feature} />
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
  const trigger = unstyled ? (
    <button {...buttonProps} type="button" className={className}>
      {children}
    </button>
  ) : (
    <Button {...buttonProps} type="button" variant={variant} className={className}>
      {children}
    </Button>
  )
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <UnavailableContent feature={feature} />
    </Dialog>
  )
}
