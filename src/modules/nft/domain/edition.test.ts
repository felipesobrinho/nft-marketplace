import { describe, expect, it } from 'vitest'
import type { Edition, NftDetail } from '@/shared/contracts/catalog'
import { clampQuantity, defaultEdition, editionDisplayLabel, editionLimit } from './edition'

const edition = (id: string, price: string, overrides: Partial<Edition> = {}): Edition => ({
  id,
  label: '1/10',
  supply: 10,
  available: 6,
  price,
  maxPerOrder: 3,
  status: 'available',
  ...overrides,
})

const nft = (editions: Edition[]) => ({ editions }) as unknown as NftDetail

describe('edição', () => {
  it('escolhe a edição disponível mais barata', () => {
    const editions = [
      edition('a', '2.40', { status: 'sold_out', available: 0 }),
      edition('b', '1.59'),
      edition('c', '1.19'),
      edition('d', '1.29', { supply: null, available: null }),
    ]
    expect(defaultEdition(nft(editions)).id).toBe('c')
  })

  it('cai na mais barata quando tudo esgotou', () => {
    const editions = [
      edition('a', '3', { status: 'sold_out', available: 0 }),
      edition('b', '2', { status: 'sold_out', available: 0 }),
    ]
    expect(defaultEdition(nft(editions)).id).toBe('b')
  })

  it('limita pelo menor entre o limite por pedido e o estoque', () => {
    expect(editionLimit(edition('a', '1', { maxPerOrder: 5, available: 2 }))).toEqual({
      max: 2,
      soldOut: false,
      reason: null,
    })
    expect(editionLimit(edition('a', '1', { maxPerOrder: 10, available: null })).max).toBe(10)
  })

  it('explica o motivo quando o limite é 1', () => {
    expect(editionLimit(edition('a', '1', { maxPerOrder: 1, supply: 1, available: 1 })).reason).toBe(
      'Limite de 1 por pedido nesta edição',
    )
    expect(editionLimit(edition('a', '1', { maxPerOrder: 3, available: 1 })).reason).toBe(
      'Só resta 1 unidade desta edição',
    )
    expect(editionLimit(edition('a', '1', { status: 'sold_out', available: 0 }))).toEqual({
      max: 0,
      soldOut: true,
      reason: 'Edição esgotada',
    })
  })

  it('mantém a quantidade entre 1 e o limite', () => {
    const limit = editionLimit(edition('a', '1', { maxPerOrder: 3 }))
    expect(clampQuantity(0, limit)).toBe(1)
    expect(clampQuantity(5, limit)).toBe(3)
    expect(clampQuantity(2.7, limit)).toBe(2)
  })

  it('padroniza o rótulo da edição aberta', () => {
    expect(editionDisplayLabel('ABERTA')).toBe('Aberta')
    expect(editionDisplayLabel('1/50')).toBe('1/50')
  })
})
