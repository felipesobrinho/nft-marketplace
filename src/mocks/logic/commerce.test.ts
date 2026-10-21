import { describe, expect, it } from 'vitest'
import type { CartItemRecord, CouponRecord, NftRecord } from '../db/schema'
import {
  computeQuote,
  editionLimit,
  idempotencyDecision,
  mergeCartItems,
  priceCart,
  quoteSignature,
  requestFingerprint,
  transactionReference,
} from './commerce'

function nft(id: string, price: string, overrides: Partial<NftRecord['editions'][number]> = {}): NftRecord {
  return {
    id,
    name: `NFT ${id}`,
    tokenId: 1,
    collection: { id: 'arte-digital', name: 'Arte digital' },
    network: 'ethereum',
    image: { src: '/nfts/emerald-ape', alt: 'arte' },
    price,
    previousPrice: null,
    badge: null,
    availability: 'available',
    listedAt: '2026-09-01T12:00:00.000Z',
    version: 1,
    description: 'descrição',
    story: ['história'],
    creator: 'Nova Sato',
    contractAddress: `0x${'a'.repeat(40)}`,
    royaltiesBps: 500,
    attributes: [],
    rating: { average: 4.8, count: 19 },
    editions: [
      {
        id: `${id}-e`,
        label: '1/10',
        supply: 10,
        available: 10,
        price,
        maxPerOrder: 10,
        status: 'available',
        ...overrides,
      },
    ],
    reviews: [],
    isNew: false,
    isTrending: false,
    featured: null,
  }
}

function line(
  id: string,
  nftId: string,
  quantity: number,
  addedAt = '2026-10-01T12:00:00.000Z',
): CartItemRecord {
  return { id, cartId: 'cart-1', nftId, editionId: `${nftId}-e`, quantity, addedAt }
}

const jungle: CouponRecord = {
  code: 'JUNGLE10',
  percentBps: 1_000,
  description: '10%',
  expiresAt: '2030-12-31T23:59:59.000Z',
}
const expired: CouponRecord = {
  ...jungle,
  code: 'VELHO20',
  percentBps: 2_000,
  expiresAt: '2026-01-31T23:59:59.000Z',
}
const now = new Date('2026-10-21T12:00:00.000Z')

describe('cotação', () => {
  const nfts = [nft('a', '1.19'), nft('b', '1.39'), nft('c', '1.79')]
  const items = priceCart([line('1', 'a', 2), line('2', 'b', 6), line('3', 'c', 9)], nfts)

  it('reproduz o exemplo do Figma: subtotal 26.83, taxa 0.016 e total 26.846', () => {
    const quote = computeQuote({ items, coupon: undefined, network: 'ethereum', now })
    expect(quote.lines.map((item) => item.lineTotal)).toEqual(['2.38', '8.34', '16.11'])
    expect(quote.subtotal).toBe('26.83')
    expect(quote.discount).toBe('0')
    expect(quote.networkFee).toBe('0.016')
    expect(quote.total).toBe('26.846')
    expect(quote.issues).toEqual([])
  })

  it('aplica cupom válido em pontos-base sobre o subtotal', () => {
    const quote = computeQuote({ items, coupon: jungle, network: 'ethereum', now })
    expect(quote.discount).toBe('2.683')
    expect(quote.total).toBe('24.163')
    expect(quote.coupon?.code).toBe('JUNGLE10')
  })

  it('não aplica cupom expirado e registra o problema', () => {
    const quote = computeQuote({ items, coupon: expired, network: 'ethereum', now })
    expect(quote.coupon).toBeNull()
    expect(quote.discount).toBe('0')
    expect(quote.issues.map((issue) => issue.code)).toEqual(['coupon_expired'])
  })

  it('usa a taxa da rede escolhida', () => {
    expect(computeQuote({ items, coupon: undefined, network: 'polygon', now }).networkFee).toBe('0.002')
    expect(computeQuote({ items: [], coupon: undefined, network: 'ethereum', now }).networkFee).toBe('0')
  })

  it('tira do total a edição esgotada e acusa limite de quantidade', () => {
    const catalog = [
      nft('a', '1.19', { available: 0, status: 'sold_out' }),
      nft('b', '1.39', { maxPerOrder: 3 }),
    ]
    const priced = priceCart([line('1', 'a', 1), line('2', 'b', 5)], catalog)
    expect(priced.map((item) => item.status)).toEqual(['sold_out', 'limited'])
    const quote = computeQuote({ items: priced, coupon: undefined, network: 'ethereum', now })
    expect(quote.lines).toHaveLength(1)
    expect(quote.issues.map((issue) => issue.code)).toEqual(['out_of_stock', 'quantity_limit'])
  })

  it('a assinatura muda quando o preço muda e não muda com a mesma cotação', () => {
    const before = computeQuote({ items, coupon: undefined, network: 'ethereum', now })
    const same = computeQuote({ items, coupon: undefined, network: 'ethereum', now })
    const repriced = priceCart(
      [line('1', 'a', 2), line('2', 'b', 6), line('3', 'c', 9)],
      [nft('a', '1.31'), nft('b', '1.39'), nft('c', '1.79')],
    )
    const after = computeQuote({ items: repriced, coupon: undefined, network: 'ethereum', now })
    expect(quoteSignature(same)).toBe(quoteSignature(before))
    expect(quoteSignature(after)).not.toBe(quoteSignature(before))
  })
})

describe('limite da edição', () => {
  it('é o menor entre o limite por pedido e o estoque', () => {
    expect(editionLimit(nft('a', '1', { available: 2, maxPerOrder: 5 }), 'a-e')).toEqual({
      max: 2,
      soldOut: false,
    })
    expect(editionLimit(nft('a', '1', { available: null, maxPerOrder: 10 }), 'a-e')).toEqual({
      max: 10,
      soldOut: false,
    })
    expect(editionLimit(nft('a', '1', { available: 0, status: 'sold_out' }), 'a-e')).toEqual({
      max: 0,
      soldOut: true,
    })
    expect(editionLimit(nft('a', '1'), 'outra')).toBeNull()
  })
})

describe('merge do carrinho do visitante', () => {
  it('soma a mesma edição respeitando o limite e descarta o esgotado', () => {
    const nfts = [
      nft('a', '1', { maxPerOrder: 3 }),
      nft('b', '1', { available: 0, status: 'sold_out' }),
      nft('c', '1'),
    ]
    const { quantities, adjustments } = mergeCartItems({
      guest: [line('g1', 'a', 2), line('g2', 'b', 1), line('g3', 'c', 4)],
      user: [line('u1', 'a', 2)],
      nfts,
    })
    expect(quantities.get('a-e')?.quantity).toBe(3)
    expect(quantities.get('c-e')?.quantity).toBe(4)
    expect(quantities.has('b-e')).toBe(false)
    expect(adjustments).toEqual([
      { nftId: 'a', editionId: 'a-e', name: 'NFT a', requested: 4, applied: 3, reason: 'quantity_limit' },
      { nftId: 'b', editionId: 'b-e', name: 'NFT b', requested: 1, applied: 0, reason: 'out_of_stock' },
    ])
  })

  it('não muda nada quando o visitante não tem itens', () => {
    const { quantities, adjustments } = mergeCartItems({
      guest: [],
      user: [line('u1', 'a', 1)],
      nfts: [nft('a', '1')],
    })
    expect(quantities.get('a-e')?.quantity).toBe(1)
    expect(adjustments).toEqual([])
  })
})

describe('idempotência', () => {
  const body = {
    quoteId: 'q1',
    walletId: 'w1',
    network: 'ethereum',
    provider: 'metamask',
    buyer: { email: 'a@b.c' },
  }

  it('a impressão digital ignora a ordem das chaves', () => {
    const reordered = {
      buyer: { email: 'a@b.c' },
      provider: 'metamask',
      network: 'ethereum',
      walletId: 'w1',
      quoteId: 'q1',
    }
    expect(requestFingerprint(reordered)).toBe(requestFingerprint(body))
  })

  it('mesma chave e mesmo corpo recuperam o pedido; corpo diferente dá conflito', () => {
    const fingerprint = requestFingerprint(body)
    expect(idempotencyDecision(undefined, fingerprint)).toBe('create')
    expect(idempotencyDecision({ requestHash: fingerprint }, fingerprint)).toBe('replay')
    expect(
      idempotencyDecision({ requestHash: fingerprint }, requestFingerprint({ ...body, walletId: 'w2' })),
    ).toBe('conflict')
  })

  it('a referência da transação é estável e tem 32 bytes em hexadecimal', () => {
    const reference = transactionReference('ord-1')
    expect(reference).toBe(transactionReference('ord-1'))
    expect(reference).toMatch(/^0x[0-9a-f]{64}$/)
    expect(transactionReference('ord-2')).not.toBe(reference)
  })
})
