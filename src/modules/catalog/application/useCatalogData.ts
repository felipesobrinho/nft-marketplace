import { useQuery } from '@tanstack/react-query'
import type { CatalogSearch } from '../domain/search'
import { toListQuery } from '../domain/search'
import { collectionsQuery, featuredQuery, networksQuery, nftListQuery } from './queries'

export function useCatalogList(search: CatalogSearch) {
  const query = useQuery(nftListQuery(toListQuery(search)))
  return { query, isUpdating: query.isFetching && query.isPlaceholderData }
}

export function useFeaturedNfts() {
  return useQuery(featuredQuery())
}

export function useCatalogFacets() {
  const collections = useQuery(collectionsQuery())
  const networks = useQuery(networksQuery())
  return { collections, networks }
}
