import type { Ref } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleCheck, Coins, Link2, Wallet as WalletIcon } from 'lucide-react'
import { type Wallet, type WalletType, walletTypeNames, walletTypeSchema } from '@/shared/contracts/account'
import { networkNames } from '@/shared/contracts/common'
import { formatEnsName, shortenAddress } from '@/shared/domain/format'
import { Button } from '@/shared/ui/components/ui/button'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { RadioCard, RadioCardGroup } from '@/shared/ui/RadioCard'
import type { DraftChange } from '../application/draft'
import { useWalletConnection } from '../application/connection'
import { useSelectedWallet } from '../application/purchase'
import { type CheckoutDraft, withProvider, withStep, withWallet } from '../domain/draft'
import { StepHeading } from './StepHeading'

const providerIcons: Record<WalletType, typeof WalletIcon> = {
  metamask: WalletIcon,
  walletconnect: Link2,
  coinbase: Coins,
}

export function roleLabel(wallet: Wallet): string {
  return wallet.role === 'primary' ? 'Principal' : 'Reserva'
}

export function walletTitle(wallet: Wallet): string {
  const role = roleLabel(wallet)
  return wallet.nickname.toLowerCase() === role.toLowerCase() ? role : `${wallet.nickname} · ${role}`
}

export function walletAddressLabel(wallet: Wallet): string {
  return wallet.ensName ? formatEnsName(wallet.ensName) : shortenAddress(wallet.address)
}

interface WalletStepProps {
  draft: CheckoutDraft
  onChange: (change: DraftChange) => void
  headingRef: Ref<HTMLHeadingElement>
  totalLabel: string | null
}

export function WalletStep({ draft, onChange, headingRef, totalLabel }: WalletStepProps) {
  const { wallet, wallets } = useSelectedWallet()
  const connection = useWalletConnection()
  const items = wallets.data ?? []
  const busy = connection.connecting || connection.disconnecting
  const canConnect = wallet !== null && draft.provider !== null && !connection.connected

  const selectProvider = (value: string) => {
    const parsed = walletTypeSchema.safeParse(value)
    if (parsed.success) onChange((current) => withProvider(current, parsed.data))
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        headingRef={headingRef}
        title="Carteira e rede"
        description="Escolha uma das suas carteiras cadastradas e o provedor para conectar."
      />

      {wallets.isPending && wallets.data === undefined ? (
        <div role="status" aria-busy="true" aria-label="Carregando as carteiras" className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : wallets.data === undefined ? (
        <ErrorState
          title="Não foi possível carregar as carteiras"
          message="Verifique sua conexão e tente de novo."
          onRetry={() => void wallets.refetch()}
          isRetrying={wallets.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<WalletIcon className="size-6" />}
          title="Você ainda não tem carteiras cadastradas"
          description="Cadastre uma carteira para escolher a rede e pagar."
          action={
            <Button asChild>
              <Link to="/conta/carteiras">Cadastrar carteira</Link>
            </Button>
          }
        />
      ) : (
        <>
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="text-body-lg font-bold text-foreground">Carteira cadastrada</legend>
            <RadioCardGroup
              value={draft.walletId ?? ''}
              onValueChange={(value) => onChange((current) => withWallet(current, value))}
            >
              {items.map((item) => (
                <RadioCard
                  key={item.id}
                  value={item.id}
                  title={walletTitle(item)}
                  description={
                    <>
                      <span className="block">{walletAddressLabel(item)}</span>
                      <span className="block">Rede {networkNames[item.network]}</span>
                    </>
                  }
                />
              ))}
            </RadioCardGroup>
            {wallet ? (
              <p className="text-small text-muted-foreground">
                A rede vem da carteira escolhida: {networkNames[wallet.network]}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="text-body-lg font-bold text-foreground">Provedor</legend>
            <RadioCardGroup value={draft.provider ?? ''} onValueChange={selectProvider}>
              {walletTypeSchema.options.map((provider) => {
                const Icon = providerIcons[provider]
                return (
                  <RadioCard
                    key={provider}
                    value={provider}
                    title={walletTypeNames[provider]}
                    icon={<Icon className="size-5" />}
                  />
                )
              })}
            </RadioCardGroup>
          </fieldset>

          <div className="flex flex-col gap-3">
            {connection.connected && draft.provider ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary bg-surface-raised p-4">
                <p role="status" className="flex items-center gap-2 text-body font-bold text-foreground">
                  <CircleCheck aria-hidden="true" className="size-5 text-highlight" />
                  Conectada com {walletTypeNames[draft.provider]}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  aria-busy={connection.disconnecting}
                  onClick={connection.disconnect}
                >
                  {connection.disconnecting ? 'Desconectando…' : 'Desconectar'}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:w-fit"
                  disabled={!canConnect || busy}
                  aria-busy={connection.connecting}
                  onClick={connection.connect}
                >
                  {connection.connecting ? 'Conectando…' : 'Conectar carteira'}
                </Button>
                {!canConnect && !busy ? (
                  <p className="text-caption text-muted-foreground">
                    Escolha uma carteira e um provedor para conectar.
                  </p>
                ) : null}
              </>
            )}
            {connection.error ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-destructive bg-surface-raised p-3 text-small text-foreground"
              >
                <span>{connection.error}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={connection.connecting}
                  onClick={connection.connect}
                >
                  Tentar de novo
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}

      <div className="flex flex-col gap-4">
        {totalLabel ? (
          <p className="flex items-baseline justify-between gap-4 md:hidden">
            <span className="text-body font-bold text-foreground">Total:</span>
            <span className="text-title font-bold text-highlight">{totalLabel}</span>
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
          <Button
            type="button"
            variant="ghost"
            className="w-full md:w-fit"
            onClick={() => onChange((current) => withStep(current, 'dados'))}
          >
            Voltar
          </Button>
          <Button
            type="button"
            className="w-full md:w-fit"
            disabled={!connection.connected}
            onClick={() => onChange((current) => withStep(current, 'revisao'))}
          >
            Continuar para a revisão
          </Button>
        </div>
      </div>
    </div>
  )
}
