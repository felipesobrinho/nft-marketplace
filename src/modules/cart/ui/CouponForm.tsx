import { useState, type FormEvent } from 'react'
import type { Cart } from '@/shared/contracts/commerce'
import { isApiError } from '@/shared/domain/apiError'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { FormField } from '@/shared/ui/form/FormField'
import { useApplyCoupon, useRemoveCoupon } from '../application/mutations'

export function CouponForm({ coupon }: { coupon: Cart['coupon'] }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>()
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const announce = useAnnounce()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (!normalized) {
      setError('Informe o código promocional')
      return
    }
    setError(undefined)
    try {
      await apply.mutateAsync(normalized)
      setCode('')
      announce(`Cupom ${normalized} aplicado.`)
    } catch (failure) {
      setError(
        isApiError(failure)
          ? (failure.fields['code'] ?? failure.message)
          : 'Não foi possível aplicar o cupom.',
      )
    }
  }

  if (coupon) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-small font-medium text-foreground">Código promocional</p>
        <div className="flex items-center justify-between gap-3 rounded-sm bg-surface-raised p-3">
          <p className="min-w-0 text-small text-foreground">
            {coupon.code} · {coupon.description}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Remover cupom
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)}>
      <FormField id="cart-coupon" label="Código promocional" {...(error ? { error } : {})}>
        {(control) => (
          <div className="flex">
            <Input
              {...control}
              value={code}
              placeholder="Digite o código"
              autoComplete="off"
              onChange={(event) => setCode(event.target.value)}
              className="rounded-r-none"
            />
            <Button type="submit" disabled={apply.isPending} className="rounded-l-none">
              Aplicar
            </Button>
          </div>
        )}
      </FormField>
    </form>
  )
}
