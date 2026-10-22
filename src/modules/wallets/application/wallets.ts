import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUserId } from '@/modules/auth'
import type { Wallet, WalletInput, WalletType } from '@/shared/contracts/account'
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  fetchWallets,
  updateWallet,
} from '../infrastructure/walletsApi'

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

export interface SaveWalletInput {
  walletId: string | null
  input: WalletInput
}

const roleOrder: Record<Wallet['role'], number> = { primary: 0, secondary: 1 }

function upsert(list: Wallet[] | undefined, wallet: Wallet): Wallet[] {
  const others = (list ?? []).filter((item) => item.id !== wallet.id)
  return [...others, wallet].sort((a, b) => roleOrder[a.role] - roleOrder[b.role])
}

export function useSaveWallet() {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ walletId, input }: SaveWalletInput) =>
      walletId ? updateWallet(walletId, input) : createWallet(input),
    onSuccess: (wallet) => {
      if (!userId) return
      queryClient.setQueryData<Wallet[]>(walletKeys.list(userId), (list) => upsert(list, wallet))
      void queryClient.invalidateQueries({ queryKey: walletKeys.list(userId) })
    },
  })
}
