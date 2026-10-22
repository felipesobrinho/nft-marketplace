import { z } from 'zod'
import {
  CATALOG_PAGE_SIZE,
  type CatalogSort,
  type CatalogTab,
  catalogSortSchema,
  catalogTabSchema,
  type NftListQuery,
} from '@/shared/contracts/catalog'
import { ethAmountSchema, type NetworkId, networkIdSchema } from '@/shared/contracts/common'
import { compareEth } from '@/shared/domain/eth'

export const catalogSearchDefaults = { tab: 'all', sort: 'recent', page: 1 } as const

export const catalogSearchSchema = z.object({
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  collection: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .catch(undefined),
  network: networkIdSchema.optional().catch(undefined),
  minPrice: ethAmountSchema.optional().catch(undefined),
  maxPrice: ethAmountSchema.optional().catch(undefined),
  tab: catalogTabSchema.default(catalogSearchDefaults.tab).catch(catalogSearchDefaults.tab),
  sort: catalogSortSchema.default(catalogSearchDefaults.sort).catch(catalogSearchDefaults.sort),
  page: z.coerce.number().int().min(1).default(catalogSearchDefaults.page).catch(catalogSearchDefaults.page),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export interface CatalogFilterPatch {
  q?: string | undefined
  collection?: string | undefined
  network?: NetworkId | undefined
  minPrice?: string | undefined
  maxPrice?: string | undefined
  tab?: CatalogTab
  sort?: CatalogSort
}

export function applyFilter(search: CatalogSearch, patch: CatalogFilterPatch): CatalogSearch {
  return { ...search, ...patch, page: 1 }
}

export function toggleValue<T extends string>(current: T | undefined, value: T): T | undefined {
  return current === value ? undefined : value
}

export function normalizePriceRange(min: string | undefined, max: string | undefined) {
  if (min !== undefined && max !== undefined && compareEth(min, max) > 0)
    return { minPrice: max, maxPrice: min }
  return { minPrice: min, maxPrice: max }
}

export function toListQuery(search: CatalogSearch): NftListQuery {
  return {
    q: search.q,
    collection: search.collection,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

export function activeFilterCount(search: CatalogSearch): number {
  return [search.q, search.collection, search.network, search.minPrice ?? search.maxPrice].filter(
    (value) => value !== undefined,
  ).length
}

export function clearFilters(search: CatalogSearch): CatalogSearch {
  return { tab: search.tab, sort: search.sort, page: 1 }
}
