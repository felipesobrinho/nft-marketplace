import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftListQuery, NftSummary } from '@/shared/contracts/catalog'
import { realtime } from '@/shared/infrastructure/realtime'
import { fetchCollections, fetchFeatured, fetchNetworks, fetchNftList } from '../infrastructure/catalogApi'

const FACETS_STALE_MS = 5 * 60_000

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...catalogKeys.lists(), query] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  collections: () => [...catalogKeys.all, 'collections'] as const,
  networks: () => [...catalogKeys.all, 'networks'] as const,
}

function observeVersions(items: readonly NftSummary[]): void {
  for (const item of items) realtime.observe('nft', item.id, item.version)
}

export function nftListQuery(query: NftListQuery) {
  return queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: async ({ signal }) => {
      const result = await fetchNftList(query, signal)
      observeVersions(result.items)
      return result
    },
    placeholderData: keepPreviousData,
  })
}

export function featuredQuery() {
  return queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: async ({ signal }) => {
      const result = await fetchFeatured(signal)
      observeVersions([...result.hero, ...(result.spotlight ? [result.spotlight] : [])])
      return result
    },
  })
}

export function collectionsQuery() {
  return queryOptions({
    queryKey: catalogKeys.collections(),
    queryFn: ({ signal }) => fetchCollections(signal),
    staleTime: FACETS_STALE_MS,
  })
}

export function networksQuery() {
  return queryOptions({
    queryKey: catalogKeys.networks(),
    queryFn: ({ signal }) => fetchNetworks(signal),
    staleTime: FACETS_STALE_MS,
  })
}
