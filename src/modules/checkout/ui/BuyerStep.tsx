import { useEffect, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSession } from '@/modules/auth'
import { type Buyer, buyerSchema } from '@/shared/contracts/commerce'
import { Button } from '@/shared/ui/components/ui/button'
import { Input } from '@/shared/ui/components/ui/input'
import { Textarea } from '@/shared/ui/components/ui/textarea'
import { FormField } from '@/shared/ui/form/FormField'
import { type DraftChange } from '../application/draft'
import { type CheckoutDraft, withBuyer } from '../domain/draft'
import { StepHeading } from './StepHeading'

interface BuyerStepProps {
  draft: CheckoutDraft
  onChange: (change: DraftChange) => void
  headingRef: Ref<HTMLHeadingElement>
}

export function BuyerStep({ draft, onChange, headingRef }: BuyerStepProps) {
  const { user } = useSession()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Buyer>({
    resolver: zodResolver(buyerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: draft.buyer ?? {
      displayName: user?.displayName ?? '',
      username: user?.username ?? '',
      email: user?.email ?? '',
      referralCode: '',
      note: '',
    },
  })

  useEffect(() => {
    if (draft.buyer || !user || isDirty) return
    reset({
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      referralCode: '',
      note: '',
    })
  }, [draft.buyer, isDirty, reset, user])

  const onSubmit = handleSubmit((values) => onChange((current) => withBuyer(current, values)))

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-6">
      <StepHeading
        headingRef={headingRef}
        title="Dados do colecionador"
        description="Essas informações ficam registradas no pedido."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          id="buyer-display-name"
          label="Nome de exibição"
          required
          {...(errors.displayName?.message ? { error: errors.displayName.message } : {})}
        >
          {(control) => <Input {...control} autoComplete="name" {...register('displayName')} />}
        </FormField>
        <FormField
          id="buyer-username"
          label="Nome de usuário"
          required
          {...(errors.username?.message ? { error: errors.username.message } : {})}
        >
          {(control) => (
            <Input
              {...control}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              {...register('username')}
            />
          )}
        </FormField>
        <FormField
          id="buyer-email"
          label="E-mail"
          required
          {...(errors.email?.message ? { error: errors.email.message } : {})}
        >
          {(control) => <Input {...control} type="email" autoComplete="email" {...register('email')} />}
        </FormField>
        <FormField
          id="buyer-referral"
          label="Código de indicação (opcional)"
          {...(errors.referralCode?.message ? { error: errors.referralCode.message } : {})}
        >
          {(control) => (
            <Input {...control} autoCapitalize="none" spellCheck={false} {...register('referralCode')} />
          )}
        </FormField>
        <FormField
          id="buyer-note"
          label="Observação do colecionador (opcional)"
          className="md:col-span-2"
          {...(errors.note?.message ? { error: errors.note.message } : {})}
        >
          {(control) => <Textarea {...control} {...register('note')} />}
        </FormField>
      </div>
      <Button type="submit" className="w-full md:w-fit">
        Continuar
      </Button>
    </form>
  )
}
