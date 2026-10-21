import { useEffect, useRef, useState } from 'react'
import { type FieldErrors, type Resolver, Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  type Wallet,
  type WalletInput,
  type WalletRole,
  type WalletType,
  walletInputSchema,
  walletTypeNames,
  walletTypeSchema,
} from '@/shared/contracts/account'
import { type NetworkId, networkIdSchema, networkNames } from '@/shared/contracts/common'
import { isApiError } from '@/shared/domain/apiError'
import { Button } from '@/shared/ui/components/ui/button'
import { Checkbox } from '@/shared/ui/components/ui/checkbox'
import { Input } from '@/shared/ui/components/ui/input'
import { Label } from '@/shared/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/components/ui/select'
import { FormField } from '@/shared/ui/form/FormField'
import { applyApiErrors } from '@/shared/ui/form/applyApiErrors'
import { useSaveWallet } from '../application/wallets'

interface WalletFormValues {
  nickname: string
  network: NetworkId
  address: string
  type: WalletType
  ensName: string
}

type FieldName = keyof WalletFormValues

const fieldNames: readonly FieldName[] = ['nickname', 'network', 'address', 'type', 'ensName']

const addressPlaceholders: Record<NetworkId, string> = {
  ethereum: '0x seguido de 40 caracteres',
  polygon: '0x seguido de 40 caracteres',
  solana: '32 a 44 caracteres em base58',
}

const ensSuffix = '.eth'

function stripEns(name: string | null): string {
  if (!name) return ''
  return name.endsWith(ensSuffix) ? name.slice(0, -ensSuffix.length) : name
}

function toInput(role: WalletRole, values: WalletFormValues): unknown {
  const ens = values.ensName.trim()
  return {
    role,
    nickname: values.nickname,
    network: values.network,
    address: values.address,
    type: values.type,
    ensName: ens === '' ? null : ens,
  }
}

function isFieldName(value: unknown): value is FieldName {
  return typeof value === 'string' && fieldNames.some((name) => name === value)
}

function createResolver(role: WalletRole): Resolver<WalletFormValues> {
  return (values) => {
    const parsed = walletInputSchema.safeParse(toInput(role, values))
    if (parsed.success) return { values, errors: {} }
    const errors: FieldErrors<WalletFormValues> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (isFieldName(key) && !errors[key]) {
        errors[key] = { type: issue.code, message: issue.message }
      }
    }
    return { values: {}, errors }
  }
}

function defaultValues(wallet: Wallet | undefined): WalletFormValues {
  return {
    nickname: wallet?.nickname ?? '',
    network: wallet?.network ?? 'ethereum',
    address: wallet?.address ?? '',
    type: wallet?.type ?? 'metamask',
    ensName: stripEns(wallet?.ensName ?? null),
  }
}

interface WalletFormProps {
  role: WalletRole
  wallet: Wallet | undefined
  primary: Wallet | undefined
  onClose: () => void
}

export function WalletForm({ role, wallet, primary, onClose }: WalletFormProps) {
  const save = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: createResolver(role),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: defaultValues(wallet),
  })
  const network = useWatch({ control, name: 'network' })
  const prefix = `wallet-${role}`

  useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

  function toggleSame(checked: boolean) {
    setSameAsPrimary(checked)
    if (!checked || !primary) return
    setValue('network', primary.network, { shouldDirty: true })
    setValue('address', primary.address, { shouldDirty: true })
    setValue('type', primary.type, { shouldDirty: true })
    setValue('ensName', stripEns(primary.ensName), { shouldDirty: true })
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const parsed = walletInputSchema.safeParse(toInput(role, values))
    if (!parsed.success) return
    const input: WalletInput = parsed.data
    try {
      await save.mutateAsync({ walletId: wallet?.id ?? null, input })
    } catch (error) {
      if (isApiError(error) && error.fields.role) {
        setFormError(error.fields.role)
        return
      }
      if (applyApiErrors(error, setError, fieldNames)) return
      setFormError(
        isApiError(error)
          ? error.message
          : 'Não foi possível salvar a carteira agora. Tente de novo em instantes.',
      )
      return
    }
    toast.success('Carteira salva.')
    onClose()
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      aria-busy={save.isPending}
      aria-label={role === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface-raised p-4 md:p-6"
    >
      {role === 'secondary' && primary ? (
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id={`${prefix}-same`}
            checked={sameAsPrimary}
            onCheckedChange={(checked) => toggleSame(checked === true)}
          />
          <Label htmlFor={`${prefix}-same`} className="text-small text-foreground">
            Igual à carteira principal
          </Label>
        </div>
      ) : null}
      <FormField
        id={`${prefix}-nickname`}
        label="Apelido"
        required
        {...(errors.nickname?.message ? { error: errors.nickname.message } : {})}
      >
        {(field) => <Input {...field} autoComplete="off" {...register('nickname')} />}
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          id={`${prefix}-network`}
          label="Rede"
          required
          {...(errors.network?.message ? { error: errors.network.message } : {})}
        >
          {(field) => (
            <Controller
              control={control}
              name="network"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  value={value}
                  onValueChange={(next) => {
                    const parsed = networkIdSchema.safeParse(next)
                    if (parsed.success) onChange(parsed.data)
                  }}
                >
                  <SelectTrigger {...field} ref={ref}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networkIdSchema.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {networkNames[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
        <FormField
          id={`${prefix}-type`}
          label="Tipo"
          required
          {...(errors.type?.message ? { error: errors.type.message } : {})}
        >
          {(field) => (
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange, ref } }) => (
                <Select
                  value={value}
                  onValueChange={(next) => {
                    const parsed = walletTypeSchema.safeParse(next)
                    if (parsed.success) onChange(parsed.data)
                  }}
                >
                  <SelectTrigger {...field} ref={ref}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {walletTypeSchema.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {walletTypeNames[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </div>
      <FormField
        id={`${prefix}-address`}
        label="Endereço"
        required
        {...(errors.address?.message ? { error: errors.address.message } : {})}
      >
        {(field) => (
          <Input
            {...field}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={addressPlaceholders[network]}
            {...register('address')}
          />
        )}
      </FormField>
      <FormField
        id={`${prefix}-ens`}
        label="Nome ENS (opcional)"
        {...(errors.ensName?.message ? { error: errors.ensName.message } : {})}
      >
        {(field) => (
          <div className="flex items-center gap-2">
            <Input
              {...field}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              {...register('ensName')}
            />
            <span aria-hidden="true" className="text-body text-muted-foreground">
              {ensSuffix}
            </span>
          </div>
        )}
      </FormField>
      {formError ? (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="border-l-4 border-destructive bg-background p-3 text-small text-foreground outline-none"
        >
          {formError}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
