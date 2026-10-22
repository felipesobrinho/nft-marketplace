import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { formatEth } from '@/shared/domain/format'

export function describeNftUpdate(event: NftUpdatedEvent): string {
  const { name, price, previousPrice, availability } = event.data
  if (availability === 'sold_out') return `${name} esgotou.`
  if (previousPrice !== null && previousPrice !== price) {
    return `O preço de ${name} mudou de ${formatEth(previousPrice)} para ${formatEth(price)}.`
  }
  return `${name} foi atualizado.`
}
