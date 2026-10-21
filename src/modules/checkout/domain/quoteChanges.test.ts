import { describe, expect, it } from 'vitest'
import type { Quote, QuoteLine } from '@/shared/contracts/commerce'
import { blockingIssues, canPurchase, compareQuotes, describeQuoteChange } from './quoteChanges'

function line(overrides: Partial<QuoteLine> = {}): QuoteLine {
  return {
    cartItemId: 'item-1',
    nftId: 'nft-0042',
    editionId: 'nft-0042-1-10',
    name: 'Emerald Ape #042',
    tokenId: 42,
    image: { src: '/nfts/a.avif', alt: 'Emerald Ape' },
    editionLabel: '1/10',
    unitPrice: '1.19',
    quantity: 2,
    lineTotal: '2.38',
    ...overrides,
  }
}

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-1',
    version: 1,
    cartVersion: 1,
    network: 'ethereum',
    lines: [line()],
    coupon: null,
    subtotal: '2.38',
    discount: '0',
    networkFee: '0.016',
    total: '2.396',
    issues: [],
    createdAt: '2026-10-21T10:00:00.000Z',
    expiresAt: '2026-10-21T10:10:00.000Z',
    ...overrides,
  }
}

describe('compareQuotes', () => {
  it('não acusa mudança quando só o id e as datas mudam', () => {
    const next = quote({ id: 'quote-2', createdAt: '2026-10-21T10:01:00.000Z' })
    expect(compareQuotes(quote(), next)).toEqual([])
  })

  it('compara preço como valor, não como texto', () => {
    const next = quote({ lines: [line({ unitPrice: '1.190' })] })
    expect(compareQuotes(quote(), next)).toEqual([])
  })

  it('acusa preço, quantidade e total da mesma edição', () => {
    const next = quote({
      lines: [line({ unitPrice: '1.309', quantity: 1, lineTotal: '1.309' })],
      subtotal: '1.309',
      total: '1.325',
    })
    expect(compareQuotes(quote(), next).map((change) => change.kind)).toEqual(['price', 'quantity', 'total'])
  })

  it('acusa item removido, item novo, cupom e taxa', () => {
    const next = quote({
      network: 'polygon',
      lines: [line({ editionId: 'nft-0042-1-50', editionLabel: '1/50' })],
      coupon: { code: 'KURIO10', percentBps: 1000, description: '10% de desconto' },
      networkFee: '0.002',
    })
    const kinds = compareQuotes(quote(), next).map((change) => change.kind)
    expect(kinds).toEqual(['removed', 'added', 'coupon', 'fee'])
  })
})

describe('blockingIssues e canPurchase', () => {
  it('esgotado e limite bloqueiam; cupom expirado não', () => {
    const issues: Quote['issues'] = [
      { code: 'coupon_expired', cartItemId: null, message: 'Cupom expirado' },
      { code: 'out_of_stock', cartItemId: 'item-1', message: 'Esgotou' },
    ]
    expect(blockingIssues(quote({ issues })).map((issue) => issue.code)).toEqual(['out_of_stock'])
    expect(canPurchase(quote({ issues }))).toBe(false)
    expect(canPurchase(quote({ issues: [issues[0]!] }))).toBe(true)
  })

  it('cotação sem itens não permite compra', () => {
    expect(canPurchase(quote({ lines: [] }))).toBe(false)
  })
})

describe('describeQuoteChange', () => {
  it('descreve cada mudança em português com ETH formatado', () => {
    expect(
      describeQuoteChange({
        kind: 'price',
        name: 'Emerald Ape #042',
        editionLabel: '1/10',
        from: '1.19',
        to: '1.309',
      }),
    ).toBe('Emerald Ape #042 (1/10): preço de 1.19 ETH para 1.309 ETH')
    expect(describeQuoteChange({ kind: 'coupon', from: 'KURIO10', to: null })).toBe(
      'O cupom KURIO10 não vale mais',
    )
    expect(describeQuoteChange({ kind: 'removed', name: 'Sage Nomad #009', editionLabel: '1/1' })).toBe(
      'Sage Nomad #009 (1/1) saiu do pedido',
    )
  })
})
