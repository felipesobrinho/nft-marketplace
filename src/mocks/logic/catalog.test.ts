import { describe, expect, it } from 'vitest'
import type { NftRecord } from '../db/schema'
import {
  collectionFacets,
  filterNfts,
  hasInvertedPriceBounds,
  heroNfts,
  networkFacets,
  normalizeText,
  paginate,
  priceRange,
  queryCatalog,
  sortNfts,
  spotlightNft,
} from './catalog'

interface Overrides {
  id: string
  name?: string
  price?: string
  collection?: { id: string; name: string }
  network?: NftRecord['network']
  creator?: string
  attributes?: string[]
  day?: number
  isNew?: boolean
  isTrending?: boolean
  featured?: NftRecord['featured']
}

function make(overrides: Overrides): NftRecord {
  const price = overrides.price ?? '1'
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    tokenId: 1,
    collection: overrides.collection ?? { id: 'alpha', name: 'Alpha' },
    network: overrides.network ?? 'ethereum',
    image: { src: '/nfts/x', alt: 'Imagem' },
    price,
    previousPrice: null,
    badge: null,
    availability: 'available',
    listedAt: new Date(Date.UTC(2026, 0, overrides.day ?? 1)).toISOString(),
    version: 1,
    description: 'Descrição',
    story: [],
    creator: overrides.creator ?? 'Autor',
    contractAddress: `0x${'a'.repeat(40)}`,
    royaltiesBps: 500,
    attributes: overrides.attributes ?? [],
    rating: { average: 4, count: 1 },
    editions: [
      {
        id: `${overrides.id}-e1`,
        label: '1/1',
        supply: 1,
        available: 1,
        price,
        maxPerOrder: 1,
        status: 'available',
      },
    ],
    reviews: [],
    isNew: overrides.isNew ?? false,
    isTrending: overrides.isTrending ?? false,
    featured: overrides.featured ?? null,
  }
}

const alpha = { id: 'alpha', name: 'Alpha' }
const zeta = { id: 'zeta', name: 'Zeta' }
const orbita = { id: 'orbita', name: 'Órbita' }

const fixture: NftRecord[] = [
  make({ id: 'n01', name: 'Sol', price: '0.5', collection: alpha, day: 10, isNew: true }),
  make({
    id: 'n02',
    name: 'Lua',
    price: '0.45',
    collection: alpha,
    network: 'polygon',
    day: 9,
    isTrending: true,
  }),
  make({
    id: 'n03',
    name: 'Música Viva',
    price: '10.2',
    collection: zeta,
    network: 'solana',
    day: 8,
    attributes: ['Raro'],
  }),
  make({ id: 'n04', name: 'Estrela', price: '9.99', collection: zeta, day: 7, creator: 'Ana Sá' }),
  make({
    id: 'n05',
    name: 'Ápice',
    price: '2',
    collection: orbita,
    day: 6,
    featured: 'hero',
    isNew: true,
    isTrending: true,
  }),
  make({ id: 'n06', name: 'Cometa', price: '2', collection: orbita, day: 6, featured: 'hero' }),
  make({
    id: 'n07',
    name: 'Nebulosa',
    price: '3.5',
    collection: alpha,
    network: 'polygon',
    day: 5,
    featured: 'spotlight',
  }),
  make({ id: 'n08', name: 'Zênite', price: '0.001', collection: zeta, day: 4 }),
  make({ id: 'n09', name: 'Aurora', price: '7', collection: orbita, network: 'solana', day: 3 }),
  make({ id: 'n10', name: 'Zênite', price: '5', collection: alpha, day: 2 }),
]

const base = { tab: 'all', sort: 'recent', page: 1, pageSize: 9 } as const

function ids(records: readonly NftRecord[]): string[] {
  return records.map((record) => record.id)
}

describe('normalizeText', () => {
  it('removes accents and lowercases', () => {
    expect(normalizeText('Música ÁPICE')).toBe('musica apice')
  })
})

describe('filterNfts', () => {
  it('finds accented names without accents', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', q: 'musica' }))).toEqual(['n03'])
  })

  it('searches collection, creator and attributes', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', q: 'orbita' }))).toEqual(['n05', 'n06', 'n09'])
    expect(ids(filterNfts(fixture, { tab: 'all', q: 'ana sa' }))).toEqual(['n04'])
    expect(ids(filterNfts(fixture, { tab: 'all', q: 'raro' }))).toEqual(['n03'])
  })

  it('filters by collection', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', collection: 'zeta' }))).toEqual(['n03', 'n04', 'n08'])
  })

  it('filters by network', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', network: 'solana' }))).toEqual(['n03', 'n09'])
  })

  it('filters by inclusive price bounds in wei', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', minPrice: '2', maxPrice: '5' }))).toEqual([
      'n05',
      'n06',
      'n07',
      'n10',
    ])
    expect(ids(filterNfts(fixture, { tab: 'all', minPrice: '9.99' }))).toEqual(['n03', 'n04'])
  })

  it('compares prices numerically, not as text', () => {
    expect(ids(filterNfts(fixture, { tab: 'all', maxPrice: '0.5' }))).toEqual(['n01', 'n02', 'n08'])
    expect(ids(filterNfts(fixture, { tab: 'all', minPrice: '0.5', maxPrice: '0.5' }))).toEqual(['n01'])
    expect(ids(filterNfts(fixture, { tab: 'all', minPrice: '9.99', maxPrice: '10.2' }))).toEqual([
      'n03',
      'n04',
    ])
  })

  it('filters by tab', () => {
    expect(ids(filterNfts(fixture, { tab: 'new' }))).toEqual(['n01', 'n05'])
    expect(ids(filterNfts(fixture, { tab: 'trending' }))).toEqual(['n02', 'n05'])
  })

  it('combines filters with AND', () => {
    expect(
      ids(filterNfts(fixture, { tab: 'all', collection: 'alpha', network: 'polygon', maxPrice: '1' })),
    ).toEqual(['n02'])
    expect(ids(filterNfts(fixture, { tab: 'trending', collection: 'orbita', q: 'apice' }))).toEqual(['n05'])
    expect(ids(filterNfts(fixture, { tab: 'new', network: 'solana' }))).toEqual([])
  })
})

describe('hasInvertedPriceBounds', () => {
  it('detects min greater than max numerically', () => {
    expect(hasInvertedPriceBounds('10', '9.99')).toBe(true)
    expect(hasInvertedPriceBounds('0.5', '0.45')).toBe(true)
    expect(hasInvertedPriceBounds('0.45', '0.5')).toBe(false)
    expect(hasInvertedPriceBounds('1', '1')).toBe(false)
    expect(hasInvertedPriceBounds('1', undefined)).toBe(false)
  })
})

describe('sortNfts', () => {
  it('sorts by recent with id tie-break', () => {
    expect(ids(sortNfts(fixture, 'recent'))).toEqual([
      'n01',
      'n02',
      'n03',
      'n04',
      'n05',
      'n06',
      'n07',
      'n08',
      'n09',
      'n10',
    ])
    const reversed = [...fixture].reverse()
    expect(ids(sortNfts(reversed, 'recent'))).toEqual(ids(sortNfts(fixture, 'recent')))
  })

  it('sorts by price ascending with wei comparison and tie-break', () => {
    expect(ids(sortNfts(fixture, 'price_asc'))).toEqual([
      'n08',
      'n02',
      'n01',
      'n05',
      'n06',
      'n07',
      'n10',
      'n09',
      'n04',
      'n03',
    ])
  })

  it('sorts by price descending keeping id ascending on ties', () => {
    expect(ids(sortNfts(fixture, 'price_desc'))).toEqual([
      'n03',
      'n04',
      'n09',
      'n10',
      'n07',
      'n05',
      'n06',
      'n01',
      'n02',
      'n08',
    ])
  })

  it('sorts by name ascending with pt-BR collation and tie-break', () => {
    expect(ids(sortNfts(fixture, 'name_asc'))).toEqual([
      'n05',
      'n09',
      'n06',
      'n04',
      'n02',
      'n03',
      'n07',
      'n01',
      'n08',
      'n10',
    ])
  })

  it('sorts by name descending keeping id ascending on ties', () => {
    expect(ids(sortNfts(fixture, 'name_desc'))).toEqual([
      'n08',
      'n10',
      'n01',
      'n07',
      'n03',
      'n02',
      'n04',
      'n06',
      'n09',
      'n05',
    ])
  })

  it('does not mutate the input', () => {
    const copy = ids(fixture)
    sortNfts(fixture, 'price_desc')
    expect(ids(fixture)).toEqual(copy)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 10 }, (_, index) => index)

  it('returns a full page', () => {
    expect(paginate(items, 1, 4)).toEqual({ items: [0, 1, 2, 3], total: 10, totalPages: 3 })
  })

  it('returns the last partial page', () => {
    expect(paginate(items, 3, 4)).toEqual({ items: [8, 9], total: 10, totalPages: 3 })
  })

  it('returns no items beyond the end with the real total', () => {
    expect(paginate(items, 4, 4)).toEqual({ items: [], total: 10, totalPages: 3 })
  })

  it('returns zero pages when empty', () => {
    expect(paginate([], 1, 4)).toEqual({ items: [], total: 0, totalPages: 0 })
  })

  it('handles an exact multiple', () => {
    expect(paginate(items, 2, 5)).toEqual({ items: [5, 6, 7, 8, 9], total: 10, totalPages: 2 })
  })
})

describe('queryCatalog', () => {
  it('filters, sorts and paginates together', () => {
    const page = queryCatalog(fixture, {
      ...base,
      collection: 'alpha',
      sort: 'price_asc',
      pageSize: 2,
      page: 2,
    })
    expect(ids(page.items)).toEqual(['n07', 'n10'])
    expect(page.total).toBe(4)
    expect(page.totalPages).toBe(2)
  })

  it('returns empty result when nothing matches', () => {
    const page = queryCatalog(fixture, { ...base, q: 'inexistente' })
    expect(page).toEqual({ items: [], total: 0, totalPages: 0 })
  })
})

describe('priceRange', () => {
  it('uses numeric min and max over the whole list', () => {
    expect(priceRange(fixture)).toEqual({ min: '0.001', max: '10.2' })
  })

  it('returns zeros for an empty list', () => {
    expect(priceRange([])).toEqual({ min: '0', max: '0' })
  })
})

describe('facets', () => {
  it('counts collections sorted alphabetically with accents', () => {
    expect(collectionFacets(fixture)).toEqual([
      { id: 'alpha', name: 'Alpha', count: 4 },
      { id: 'orbita', name: 'Órbita', count: 3 },
      { id: 'zeta', name: 'Zeta', count: 3 },
    ])
  })

  it('lists networks in fixed order including zero counts', () => {
    expect(networkFacets(fixture)).toEqual([
      { id: 'ethereum', name: 'Ethereum', count: 6 },
      { id: 'polygon', name: 'Polygon', count: 2 },
      { id: 'solana', name: 'Solana', count: 2 },
    ])
    expect(networkFacets([make({ id: 'x1' })])).toEqual([
      { id: 'ethereum', name: 'Ethereum', count: 1 },
      { id: 'polygon', name: 'Polygon', count: 0 },
      { id: 'solana', name: 'Solana', count: 0 },
    ])
  })
})

describe('featured', () => {
  it('orders hero records by listedAt desc and finds the spotlight', () => {
    expect(ids(heroNfts(fixture))).toEqual(['n05', 'n06'])
    expect(spotlightNft(fixture)?.id).toBe('n07')
  })

  it('returns null spotlight when none is flagged', () => {
    expect(spotlightNft([make({ id: 'x1' })])).toBeNull()
  })
})
