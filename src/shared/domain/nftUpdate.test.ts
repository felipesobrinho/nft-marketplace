import { describe, expect, it } from 'vitest'
import type { NftDetail, NftSummary } from '@/shared/contracts/catalog'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { applyNftUpdate, applyNftUpdateToDetail, applyNftUpdateToList, describeNftUpdate } from './nftUpdate'

const base: NftUpdatedEvent = {
  eventId: 'e1',
  type: 'nft.updated',
  resource: { type: 'nft', id: 'nft-0042' },
  version: 2,
  occurredAt: '2026-10-21T12:00:00.000Z',
  data: {
    name: 'Emerald Ape #042',
    price: '1.29',
    previousPrice: '1.19',
    availability: 'available',
    editions: [],
  },
}

describe('describeNftUpdate', () => {
  it('descreve mudança de preço', () => {
    expect(describeNftUpdate(base)).toBe('O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.')
  })

  it('descreve esgotamento', () => {
    expect(describeNftUpdate({ ...base, data: { ...base.data, availability: 'sold_out' } })).toBe(
      'Emerald Ape #042 esgotou.',
    )
  })

  it('descreve outra atualização', () => {
    expect(describeNftUpdate({ ...base, data: { ...base.data, previousPrice: null } })).toBe(
      'Emerald Ape #042 foi atualizado.',
    )
  })
})

const summary: NftSummary = {
  id: 'nft-0042',
  name: 'Emerald Ape #042',
  tokenId: 42,
  collection: { id: 'arte-digital', name: 'Arte digital' },
  network: 'ethereum',
  image: { src: '/nfts/a', alt: 'Emerald Ape' },
  price: '1.19',
  previousPrice: null,
  badge: null,
  availability: 'available',
  listedAt: '2026-10-01T12:00:00.000Z',
  version: 1,
}

const withEditions: NftUpdatedEvent = {
  ...base,
  data: {
    ...base.data,
    editions: [{ id: 'nft-0042-1-50', price: '1.29', available: 0, status: 'sold_out' }],
  },
}

describe('applyNftUpdate', () => {
  it('troca preço, preço anterior, disponibilidade e versão', () => {
    expect(applyNftUpdate(summary, base)).toMatchObject({ price: '1.29', previousPrice: '1.19', version: 2 })
  })

  it('não regride com evento de versão igual ou menor e ignora outro NFT', () => {
    const current = { ...summary, version: 3 }
    expect(applyNftUpdate(current, base)).toBe(current)
    const other = { ...summary, id: 'nft-0088' }
    expect(applyNftUpdate(other, base)).toBe(other)
  })

  it('na lista, devolve a mesma referência quando nada muda', () => {
    const list = [{ ...summary, id: 'nft-0088' }]
    expect(applyNftUpdateToList(list, base)).toBe(list)
    expect(applyNftUpdateToList([summary], base)[0]?.price).toBe('1.29')
  })

  it('no detalhe, atualiza só as edições citadas no evento', () => {
    const detail = {
      ...summary,
      editions: [
        {
          id: 'nft-0042-1-50',
          label: '1/50',
          supply: 50,
          available: 3,
          price: '1.19',
          maxPerOrder: 5,
          status: 'available',
        },
        {
          id: 'nft-0042-1-10',
          label: '1/10',
          supply: 10,
          available: 2,
          price: '2.10',
          maxPerOrder: 2,
          status: 'available',
        },
      ],
    } as unknown as NftDetail
    const updated = applyNftUpdateToDetail(detail, withEditions)
    expect(updated.editions[0]).toMatchObject({ price: '1.29', available: 0, status: 'sold_out' })
    expect(updated.editions[1]).toBe(detail.editions[1])
    expect(updated.version).toBe(2)
  })
})
