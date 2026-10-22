import { describe, expect, it } from 'vitest'
import type { Cart, CartItem } from '@/shared/contracts/commerce'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { describeCartImpact } from './cartImpact'

const item: CartItem = {
  id: 'item-1',
  nftId: 'nft-0042',
  editionId: 'nft-0042-1-50',
  quantity: 2,
  name: 'Emerald Ape #042',
  tokenId: 42,
  image: { src: '/nfts/a', alt: 'Emerald Ape' },
  editionLabel: '1/50',
  unitPrice: '1.19',
  lineTotal: '2.38',
  maxQuantity: 5,
  status: 'available',
}

const cart: Cart = { id: 'cart-1', items: [item], coupon: null, itemCount: 2, subtotal: '2.38', version: 1 }

function event(editions: NftUpdatedEvent['data']['editions']): NftUpdatedEvent {
  return {
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
      editions,
    },
  }
}

describe('describeCartImpact', () => {
  it('descreve o preço novo da edição que está no carrinho', () => {
    const update = event([{ id: 'nft-0042-1-50', price: '1.5', available: 3, status: 'available' }])
    expect(describeCartImpact(cart, update)).toEqual([
      'O preço de Emerald Ape #042 (1/50) mudou de 1.19 ETH para 1.50 ETH.',
    ])
  })

  it('avisa quando a edição do carrinho esgota', () => {
    const update = event([{ id: 'nft-0042-1-50', price: '1.19', available: 0, status: 'sold_out' }])
    expect(describeCartImpact(cart, update)).toEqual(['Emerald Ape #042 (1/50) esgotou.'])
  })

  it('ignora outra edição, outro NFT e carrinho sem dados', () => {
    expect(
      describeCartImpact(
        cart,
        event([{ id: 'nft-0042-1-10', price: '2', available: 1, status: 'available' }]),
      ),
    ).toEqual([])
    expect(describeCartImpact({ ...cart, items: [{ ...item, nftId: 'nft-0088' }] }, event([]))).toEqual([])
    expect(describeCartImpact(undefined, event([]))).toEqual([])
  })
})
