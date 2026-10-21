import { z } from 'zod'
import {
  walletConnectionSchema,
  type WalletInput,
  walletListResponseSchema,
  walletSchema,
  type WalletType,
} from '@/shared/contracts/account'
import { request } from '@/shared/infrastructure/http'

export async function fetchWallets(signal?: AbortSignal) {
  const response = await request(walletListResponseSchema, { url: '/wallets', signal })
  return response.items
}

export function connectWallet(walletId: string, provider: WalletType) {
  return request(walletConnectionSchema, {
    url: `/wallets/${walletId}/connection`,
    method: 'POST',
    data: { provider },
  })
}

export async function disconnectWallet(walletId: string): Promise<void> {
  await request(z.unknown(), { url: `/wallets/${walletId}/connection`, method: 'DELETE' })
}

export function createWallet(input: WalletInput) {
  return request(walletSchema, { url: '/wallets', method: 'POST', data: input })
}

export function updateWallet(walletId: string, input: WalletInput) {
  return request(walletSchema, { url: `/wallets/${walletId}`, method: 'PATCH', data: input })
}
