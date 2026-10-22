import {
  facetListResponseSchema,
  featuredNftsResponseSchema,
  type NftListQuery,
  nftListResponseSchema,
} from '@/shared/contracts/catalog'
import { request } from '@/shared/infrastructure/http'

export function fetchNftList(query: NftListQuery, signal?: AbortSignal) {
  return request(nftListResponseSchema, { url: '/nfts', params: query, signal })
}

export function fetchFeatured(signal?: AbortSignal) {
  return request(featuredNftsResponseSchema, { url: '/nfts/featured', signal })
}

export function fetchCollections(signal?: AbortSignal) {
  return request(facetListResponseSchema, { url: '/collections', signal })
}

export function fetchNetworks(signal?: AbortSignal) {
  return request(facetListResponseSchema, { url: '/networks', signal })
}
