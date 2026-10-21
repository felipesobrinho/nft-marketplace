import { compareEth } from '@/shared/domain/eth'
import { getDb } from '../db'
import type { NftRecord } from '../db/schema'
import { nftUpdatedEvent } from '../realtime/events'
import { publish } from '../realtime/hub'

type Edition = NftRecord['editions'][number]

export interface NftChange {
  editionId?: string
  price?: string
  available?: number
}

function refreshSummary(record: NftRecord, previousPrice: string | null): void {
  const open = record.editions.filter((edition) => edition.status === 'available')
  const pool = open.length > 0 ? open : record.editions
  const cheapest = pool.reduce<Edition | undefined>((best, edition) => {
    if (!best) return edition
    return compareEth(edition.price, best.price) < 0 ? edition : best
  }, undefined)
  if (cheapest && cheapest.price !== record.price) {
    record.previousPrice = previousPrice ?? record.price
    record.price = cheapest.price
  }
  record.availability = open.length > 0 ? 'available' : 'sold_out'
}

export async function changeNft(
  nftId: string,
  change: NftChange,
): Promise<{ record: NftRecord; delivered: number } | null> {
  const db = getDb()
  const current = db.nfts.findFirst((q) => q.where({ id: nftId }))
  if (!current) return null
  const targetId = change.editionId ?? current.editions[0]?.id
  const updated = await db.nfts.update((q) => q.where({ id: nftId }), {
    data(record) {
      const before = record.price
      for (const edition of record.editions) {
        if (edition.id !== targetId) continue
        if (change.price !== undefined) edition.price = change.price
        if (change.available !== undefined) {
          edition.available = change.available
          edition.status = change.available === 0 ? 'sold_out' : 'available'
        }
      }
      refreshSummary(record, change.price !== undefined ? before : null)
      record.version += 1
    },
  })
  if (!updated) return null
  return { record: updated, delivered: publish(nftUpdatedEvent(updated)) }
}

export async function consumeStock(nftId: string, editionId: string, quantity: number): Promise<void> {
  const nft = getDb().nfts.findFirst((q) => q.where({ id: nftId }))
  const edition = nft?.editions.find((candidate) => candidate.id === editionId)
  if (!edition || edition.available === null) return
  await changeNft(nftId, { editionId, available: Math.max(0, edition.available - quantity) })
}
