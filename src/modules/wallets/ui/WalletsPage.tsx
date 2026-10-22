import { useState } from 'react'
import { type Wallet, type WalletRole, walletTypeNames } from '@/shared/contracts/account'
import { networkNames } from '@/shared/contracts/common'
import { isApiError } from '@/shared/domain/apiError'
import { formatEnsName, shortenAddress } from '@/shared/domain/format'
import { Button } from '@/shared/ui/components/ui/button'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { useWallets } from '../application/wallets'
import { WalletForm } from './WalletForm'

const sections: readonly { role: WalletRole; title: string; empty: string }[] = [
  {
    role: 'primary',
    title: 'Carteira principal',
    empty: 'Você ainda não adicionou uma carteira principal.',
  },
  {
    role: 'secondary',
    title: 'Carteira secundária',
    empty: 'Você ainda não adicionou uma carteira secundária.',
  },
]

const rowClass =
  'flex items-center justify-between gap-4 rounded-md border border-border bg-surface-raised p-4'

function WalletSummary({ wallet, onEdit }: { wallet: Wallet; onEdit: () => void }) {
  return (
    <div className={rowClass}>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-body font-bold text-foreground">{wallet.nickname}</p>
        <p className="text-small text-muted-foreground">
          {networkNames[wallet.network]} · {walletTypeNames[wallet.type]}
        </p>
        <p className="truncate text-small text-foreground">{shortenAddress(wallet.address)}</p>
        {wallet.ensName ? (
          <p className="truncate text-small text-muted-foreground">{formatEnsName(wallet.ensName)}</p>
        ) : null}
      </div>
      <Button type="button" variant="outline" onClick={onEdit}>
        Editar
        <span className="sr-only"> {wallet.nickname}</span>
      </Button>
    </div>
  )
}

export function WalletsPage() {
  const wallets = useWallets()
  const [editing, setEditing] = useState<WalletRole | null>(null)
  const items = wallets.data ?? []
  const primary = items.find((wallet) => wallet.role === 'primary')

  function renderBody() {
    if (wallets.isPending && wallets.data === undefined) {
      return (
        <div role="status" aria-busy="true" aria-label="Carregando as carteiras" className="grid gap-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )
    }
    if (wallets.data === undefined) {
      const forbidden = isApiError(wallets.error) && wallets.error.status === 403
      return (
        <ErrorState
          message={
            forbidden
              ? 'Você não tem permissão para ver as carteiras.'
              : 'Verifique sua conexão e tente de novo.'
          }
          onRetry={() => void wallets.refetch()}
          isRetrying={wallets.isFetching}
        />
      )
    }
    return sections.map(({ role, title, empty }) => {
      const wallet = items.find((item) => item.role === role)
      const headingId = `wallets-${role}-heading`
      return (
        <section key={role} aria-labelledby={headingId} className="flex flex-col gap-4">
          <h2 id={headingId} className="text-title font-bold text-foreground">
            {title}
          </h2>
          {editing === role ? (
            <WalletForm
              key={wallet?.id ?? 'new'}
              role={role}
              wallet={wallet}
              primary={primary}
              onClose={() => setEditing(null)}
            />
          ) : wallet ? (
            <WalletSummary wallet={wallet} onEdit={() => setEditing(role)} />
          ) : (
            <div className={rowClass}>
              <p className="text-small text-muted-foreground">{empty}</p>
              <Button type="button" variant="outline" onClick={() => setEditing(role)}>
                Adicionar
                <span className="sr-only"> {title.toLowerCase()}</span>
              </Button>
            </div>
          )}
        </section>
      )
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading font-bold text-foreground">Carteiras</h1>
        <p className="text-small text-muted-foreground">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </header>
      {renderBody()}
    </div>
  )
}
