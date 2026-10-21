import type { Edition, NftDetail } from '@/shared/contracts/catalog'
import { compareEth } from '@/shared/domain/eth'

export interface EditionLimit {
  max: number
  soldOut: boolean
  reason: string | null
}

export function isEditionAvailable(edition: Edition): boolean {
  return edition.status === 'available' && edition.available !== 0
}

export function defaultEdition(nft: NftDetail): Edition {
  const open = nft.editions.filter(isEditionAvailable)
  const pool = open.length > 0 ? open : nft.editions
  return pool.reduce((best, edition) => (compareEth(edition.price, best.price) < 0 ? edition : best))
}

export function editionLimit(edition: Edition): EditionLimit {
  if (!isEditionAvailable(edition)) return { max: 0, soldOut: true, reason: 'Edição esgotada' }
  const stock = edition.available ?? Number.POSITIVE_INFINITY
  const max = Math.min(edition.maxPerOrder, stock)
  if (max <= 1) {
    const reason =
      edition.maxPerOrder === 1 ? 'Limite de 1 por pedido nesta edição' : 'Só resta 1 unidade desta edição'
    return { max: 1, soldOut: false, reason }
  }
  return { max, soldOut: false, reason: null }
}

export function clampQuantity(quantity: number, limit: EditionLimit): number {
  if (limit.soldOut) return 1
  return Math.min(Math.max(1, Math.trunc(quantity)), limit.max)
}

export function editionDisplayLabel(label: string): string {
  return label.toLowerCase() === 'aberta' ? 'Aberta' : label
}
