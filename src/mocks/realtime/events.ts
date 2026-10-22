import type { NftUpdatedEvent } from '@/shared/contracts/events'
import type { NftRecord } from '../db/schema'

export function nftUpdatedEvent(record: NftRecord): NftUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resource: { type: 'nft', id: record.id },
    version: record.version,
    occurredAt: new Date().toISOString(),
    data: {
      name: record.name,
      price: record.price,
      previousPrice: record.previousPrice,
      availability: record.availability,
      editions: record.editions.map((edition) => ({
        id: edition.id,
        price: edition.price,
        available: edition.available,
        status: edition.status,
      })),
    },
  }
}
