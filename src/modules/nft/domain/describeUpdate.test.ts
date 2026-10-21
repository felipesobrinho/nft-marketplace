import { describe, expect, it } from 'vitest'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { describeNftUpdate } from './describeUpdate'

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
