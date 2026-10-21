import { Collection } from '@msw/data'
import { persist } from '@msw/data/extensions/persist'
import {
  cartItemRecordSchema,
  cartRecordSchema,
  couponRecordSchema,
  favoriteRecordSchema,
  nftRecordSchema,
  orderRecordSchema,
  quoteRecordSchema,
  sessionRecordSchema,
  userRecordSchema,
  walletRecordSchema,
} from './schema'
import { buildCouponSeed, buildFavoriteSeed, buildUserSeed, buildWalletSeed } from './seed/accounts'
import { buildNftSeed } from './seed/nfts'
import { clearAppStorage, clearPersistedDb, prepareDbStorage } from './storage'

function createCollections() {
  return {
    nfts: new Collection({ schema: nftRecordSchema, extensions: [persist()] }),
    users: new Collection({ schema: userRecordSchema, extensions: [persist()] }),
    sessions: new Collection({ schema: sessionRecordSchema, extensions: [persist()] }),
    favorites: new Collection({ schema: favoriteRecordSchema, extensions: [persist()] }),
    carts: new Collection({ schema: cartRecordSchema, extensions: [persist()] }),
    cartItems: new Collection({ schema: cartItemRecordSchema, extensions: [persist()] }),
    coupons: new Collection({ schema: couponRecordSchema, extensions: [persist()] }),
    quotes: new Collection({ schema: quoteRecordSchema, extensions: [persist()] }),
    orders: new Collection({ schema: orderRecordSchema, extensions: [persist()] }),
    wallets: new Collection({ schema: walletRecordSchema, extensions: [persist()] }),
  }
}

export type Db = ReturnType<typeof createCollections>

let instance: Db | null = null
const resetListeners = new Set<() => void>()

async function seed(db: Db): Promise<void> {
  for (const record of buildNftSeed()) await db.nfts.create(record)
  for (const record of buildUserSeed()) await db.users.create(record)
  for (const record of buildWalletSeed()) await db.wallets.create(record)
  for (const record of buildFavoriteSeed()) await db.favorites.create(record)
  for (const record of buildCouponSeed()) await db.coupons.create(record)
}

function clearAll(db: Db): void {
  for (const collection of Object.values(db)) collection.clear()
}

export async function openDb(): Promise<Db> {
  if (instance) return instance
  prepareDbStorage()
  const db = createCollections()
  if (db.nfts.count() === 0) {
    clearAll(db)
    await seed(db)
  }
  instance = db
  return db
}

export function getDb(): Db {
  if (!instance) throw new Error('Banco simulado ainda não foi aberto')
  return instance
}

export function onDbReset(listener: () => void): () => void {
  resetListeners.add(listener)
  return () => {
    resetListeners.delete(listener)
  }
}

export async function resetDb(): Promise<void> {
  const db = getDb()
  clearAll(db)
  clearPersistedDb()
  clearAppStorage()
  await seed(db)
  resetListeners.forEach((listener) => listener())
}
