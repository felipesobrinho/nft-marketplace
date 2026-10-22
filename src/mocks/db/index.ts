import { Collection } from '@msw/data'
import { persist } from '@msw/data/extensions/persist'
import { nftRecordSchema } from './schema'
import { buildSeed } from './seed'
import { clearAppStorage, clearPersistedDb, prepareDbStorage } from './storage'

function createCollections() {
  return {
    nfts: new Collection({ schema: nftRecordSchema, extensions: [persist()] }),
  }
}

export type Db = ReturnType<typeof createCollections>

let instance: Db | null = null

async function seed(db: Db): Promise<void> {
  for (const record of buildSeed()) await db.nfts.create(record)
}

export async function openDb(): Promise<Db> {
  if (instance) return instance
  prepareDbStorage()
  const db = createCollections()
  if (db.nfts.count() === 0) await seed(db)
  instance = db
  return db
}

export function getDb(): Db {
  if (!instance) throw new Error('Banco simulado ainda não foi aberto')
  return instance
}

export async function resetDb(): Promise<void> {
  const db = getDb()
  db.nfts.clear()
  clearPersistedDb()
  clearAppStorage()
  await seed(db)
}
