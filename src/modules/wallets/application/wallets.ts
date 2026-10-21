import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { useCurrentUserId } from '@/modules/auth'
import type { WalletType } from '@/shared/contracts/account'
import { connectWallet, disconnectWallet, fetchWallets } from '../infrastructure/walletsApi'

export const walletKeys = {
  list: (userId: string) => ['user', userId, 'wallets'] as const,
}

export function walletsQuery(userId: string) {
  return queryOptions({
    queryKey: walletKeys.list(userId),
    queryFn: ({ signal }) => fetchWallets(signal),
  })
}

export function useWallets() {
  const userId = useCurrentUserId()
  return useQuery({ ...walletsQuery(userId ?? 'anonimo'), enabled: userId !== null })
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: ({ walletId, provider }: { walletId: string; provider: WalletType }) =>
      connectWallet(walletId, provider),
  })
}

export function useDisconnectWallet() {
  return useMutation({
    mutationFn: (walletId: string) => disconnectWallet(walletId),
  })
}
