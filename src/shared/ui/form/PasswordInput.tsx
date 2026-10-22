import { useState, type ComponentProps, type Ref } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/shared/ui/components/ui/input'
import { cn } from '@/shared/ui/lib/utils'

export type PasswordInputProps = Omit<ComponentProps<'input'>, 'type' | 'ref'> & {
  ref?: Ref<HTMLInputElement>
}

export function PasswordInput({ className, ref, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-0 right-0 inline-flex size-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
