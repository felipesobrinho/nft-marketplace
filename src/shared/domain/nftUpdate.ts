import type { NftDetail, NftSummary } from '@/shared/contracts/catalog'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { formatEth } from './format'

export function describeNftUpdate(event: NftUpdatedEvent): string {
  const { name, price, previousPrice, availability } = event.data
  if (availability === 'sold_out') return `${name} esgotou.`
  if (previousPrice !== null && previousPrice !== price) {
    return `O preço de ${name} mudou de ${formatEth(previousPrice)} para ${formatEth(price)}.`
  }
  return `${name} foi atualizado.`
}

export function applyNftUpdate<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  return {
    ...nft,
    price: event.data.price,
    previousPrice: event.data.previousPrice,
    availability: event.data.availability,
    version: event.version,
  }
}

export function applyNftUpdateToDetail(nft: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft
  const editions = new Map(event.data.editions.map((edition) => [edition.id, edition]))
  return {
    ...applyNftUpdate(nft, event),
    editions: nft.editions.map((edition) => {
      const next = editions.get(edition.id)
      return next
        ? { ...edition, price: next.price, available: next.available, status: next.status }
        : edition
    }),
  }
}

export function applyNftUpdateToList<T extends NftSummary>(items: T[], event: NftUpdatedEvent): T[] {
  let changed = false
  const next = items.map((item) => {
    const updated = applyNftUpdate(item, event)
    if (updated !== item) changed = true
    return updated
  })
  return changed ? next : items
}
