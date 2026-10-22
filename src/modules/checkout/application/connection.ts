import { useConnectWallet, useDisconnectWallet } from '@/modules/wallets'
import { errorMessage } from '@/shared/domain/apiError'
import { isConnected, withConnection } from '../domain/draft'
import { useCheckoutDraft } from './draft'

export function useWalletConnection() {
  const { draft, update } = useCheckoutDraft()
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()

  const start = () => {
    const { walletId, provider } = draft
    if (!walletId || !provider) return
    connect.mutate(
      { walletId, provider },
      { onSuccess: () => update((current) => withConnection(current, true)) },
    )
  }

  const stop = () => {
    const { walletId } = draft
    connect.reset()
    if (!walletId) return
    disconnect.mutate(walletId, { onSettled: () => update((current) => withConnection(current, false)) })
  }

  return {
    connected: isConnected(draft),
    connecting: connect.isPending,
    disconnecting: disconnect.isPending,
    error: connect.error ? errorMessage(connect.error) : null,
    connect: start,
    disconnect: stop,
    clearError: () => connect.reset(),
  }
}
