import type { Cart } from '@/shared/contracts/commerce'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { compareEth } from '@/shared/domain/eth'
import { formatEth } from '@/shared/domain/format'

export function describeCartImpact(cart: Cart | undefined, event: NftUpdatedEvent): string[] {
  if (!cart) return []
  const editions = new Map(event.data.editions.map((edition) => [edition.id, edition]))
  const messages: string[] = []
  for (const item of cart.items) {
    if (item.nftId !== event.resource.id) continue
    const next = editions.get(item.editionId)
    if (!next) continue
    const label = `${item.name} (${item.editionLabel})`
    if (next.status === 'sold_out' || next.available === 0) {
      messages.push(`${label} esgotou.`)
    } else if (compareEth(next.price, item.unitPrice) !== 0) {
      messages.push(
        `O preço de ${label} mudou de ${formatEth(item.unitPrice)} para ${formatEth(next.price)}.`,
      )
    }
  }
  return messages
}
