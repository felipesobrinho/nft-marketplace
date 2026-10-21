import type { CouponRecord, FavoriteRecord, UserRecord, WalletRecord } from '../schema'

export const DEMO_PASSWORD_HASH = '$2b$10$XWh8uKK.q6B2jMGK59i5WOxTHqDdf8PKa5yRaiI3yIxdS0UkjzHuq'

const seededAt = '2026-09-01T12:00:00.000Z'

export function buildUserSeed(): UserRecord[] {
  return [
    {
      id: 'user-ana',
      username: 'ana.lima',
      email: 'ana@jungle.test',
      passwordHash: DEMO_PASSWORD_HASH,
      displayName: 'Ana Lima',
      ensName: 'analima',
      avatarUrl: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: 'user-bruno',
      username: 'bruno.costa',
      email: 'bruno@jungle.test',
      passwordHash: DEMO_PASSWORD_HASH,
      displayName: 'Bruno Costa',
      ensName: null,
      avatarUrl: null,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
  ]
}

export function buildWalletSeed(): WalletRecord[] {
  return [
    {
      id: 'wallet-ana-primary',
      userId: 'user-ana',
      role: 'primary',
      nickname: 'Principal',
      network: 'ethereum',
      address: '0xA91F3c5D7e2B4a6F8c1D0e9B7a5C3d2E1f40E82C',
      type: 'metamask',
      ensName: 'analima',
      updatedAt: seededAt,
    },
    {
      id: 'wallet-ana-secondary',
      userId: 'user-ana',
      role: 'secondary',
      nickname: 'Reserva',
      network: 'polygon',
      address: '0x5B2e8C4a1D9f7E3b6A0c2D4e8F1a3B5c7D9e2F46',
      type: 'coinbase',
      ensName: 'nova.kurio',
      updatedAt: seededAt,
    },
  ]
}

export function buildFavoriteSeed(): FavoriteRecord[] {
  return ['nft-0009', 'nft-0088', 'nft-0207'].map((nftId, index) => ({
    id: `fav-ana-${index + 1}`,
    userId: 'user-ana',
    nftId,
    createdAt: seededAt,
  }))
}

export function buildCouponSeed(): CouponRecord[] {
  return [
    {
      code: 'JUNGLE10',
      percentBps: 1_000,
      description: 'Desconto de lançamento de 10%',
      expiresAt: '2030-12-31T23:59:59.000Z',
    },
    {
      code: 'VELHO20',
      percentBps: 2_000,
      description: 'Campanha encerrada de 20%',
      expiresAt: '2026-01-31T23:59:59.000Z',
    },
  ]
}
