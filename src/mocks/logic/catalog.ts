import type { CatalogSort, Facet, NftListQuery } from '@/shared/contracts/catalog'
import { type NetworkId, networkNames } from '@/shared/contracts/common'
import { parseEth, toEthString } from '@/shared/domain/eth'
import type { NftRecord } from '../db/schema'

export const networkOrder: readonly NetworkId[] = ['ethereum', 'polygon', 'solana']

export type CatalogFilters = Pick<
  NftListQuery,
  'q' | 'collection' | 'network' | 'minPrice' | 'maxPrice' | 'tab'
>

export interface CatalogPage {
  items: NftRecord[]
  total: number
  totalPages: number
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function matchesText(record: NftRecord, needle: string): boolean {
  const haystack = [record.name, record.collection.name, record.creator, ...record.attributes]
  return haystack.some((value) => normalizeText(value).includes(needle))
}

export function hasInvertedPriceBounds(minPrice?: string, maxPrice?: string): boolean {
  if (minPrice === undefined || maxPrice === undefined) return false
  return parseEth(minPrice) > parseEth(maxPrice)
}

export function filterNfts(records: readonly NftRecord[], filters: CatalogFilters): NftRecord[] {
  const needle = filters.q ? normalizeText(filters.q) : ''
  const min = filters.minPrice === undefined ? null : parseEth(filters.minPrice)
  const max = filters.maxPrice === undefined ? null : parseEth(filters.maxPrice)
  return records.filter((record) => {
    if (needle && !matchesText(record, needle)) return false
    if (filters.collection && record.collection.id !== filters.collection) return false
    if (filters.network && record.network !== filters.network) return false
    const price = parseEth(record.price)
    if (min !== null && price < min) return false
    if (max !== null && price > max) return false
    if (filters.tab === 'new' && !record.isNew) return false
    if (filters.tab === 'trending' && !record.isTrending) return false
    return true
  })
}

function compareId(a: NftRecord, b: NftRecord): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function comparePrice(a: NftRecord, b: NftRecord): number {
  const left = parseEth(a.price)
  const right = parseEth(b.price)
  return left === right ? 0 : left < right ? -1 : 1
}

function compareName(a: NftRecord, b: NftRecord): number {
  return a.name.localeCompare(b.name, 'pt-BR')
}

function compareListedAt(a: NftRecord, b: NftRecord): number {
  return Date.parse(a.listedAt) - Date.parse(b.listedAt)
}

const comparators: Record<CatalogSort, (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => compareListedAt(b, a),
  price_asc: comparePrice,
  price_desc: (a, b) => comparePrice(b, a),
  name_asc: compareName,
  name_desc: (a, b) => compareName(b, a),
}

export function sortNfts(records: readonly NftRecord[], sort: CatalogSort): NftRecord[] {
  const primary = comparators[sort]
  return [...records].sort((a, b) => primary(a, b) || compareId(a, b))
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, totalPages }
}

export function queryCatalog(
  records: readonly NftRecord[],
  query: Pick<NftListQuery, 'sort' | 'page' | 'pageSize'> & CatalogFilters,
): CatalogPage {
  const sorted = sortNfts(filterNfts(records, query), query.sort)
  return paginate(sorted, query.page, query.pageSize)
}

export function priceRange(records: readonly NftRecord[]): { min: string; max: string } {
  const first = records[0]
  if (!first) return { min: '0', max: '0' }
  let min = parseEth(first.price)
  let max = min
  for (const record of records) {
    const price = parseEth(record.price)
    if (price < min) min = price
    if (price > max) max = price
  }
  return { min: toEthString(min), max: toEthString(max) }
}

export function collectionFacets(records: readonly NftRecord[]): Facet[] {
  const byId = new Map<string, Facet>()
  for (const record of records) {
    const current = byId.get(record.collection.id)
    if (current) current.count += 1
    else byId.set(record.collection.id, { ...record.collection, count: 1 })
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR') || (a.id < b.id ? -1 : 1))
}

export function networkFacets(records: readonly NftRecord[]): Facet[] {
  return networkOrder.map((id) => ({
    id,
    name: networkNames[id],
    count: records.filter((record) => record.network === id).length,
  }))
}

export function heroNfts(records: readonly NftRecord[]): NftRecord[] {
  return sortNfts(
    records.filter((record) => record.featured === 'hero'),
    'recent',
  )
}

export function spotlightNft(records: readonly NftRecord[]): NftRecord | null {
  const [first] = sortNfts(
    records.filter((record) => record.featured === 'spotlight'),
    'recent',
  )
  return first ?? null
}
