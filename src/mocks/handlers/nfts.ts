import { HttpResponse } from 'msw'
import {
  facetListResponseSchema,
  featuredNftsResponseSchema,
  type NftDetail,
  nftDetailSchema,
  nftListQuerySchema,
  nftListResponseSchema,
} from '@/shared/contracts/catalog'
import { getDb } from '../db'
import type { NftRecord } from '../db/schema'
import {
  collectionFacets,
  hasInvertedPriceBounds,
  heroNfts,
  networkFacets,
  priceRange,
  queryCatalog,
  spotlightNft,
} from '../logic/catalog'
import { isScenario } from '../scenarios/state'
import { apiRoute } from './api'
import { apiError, fieldErrors, json } from './respond'

export function toNftDetail(record: NftRecord): NftDetail {
  return nftDetailSchema.parse(record)
}

function unavailable() {
  return apiError(503, 'service_unavailable', 'Serviço indisponível no momento. Tente de novo.')
}

export const nftHandlers = [
  apiRoute(
    'get',
    '/nfts',
    ({ request }) => {
      if (isScenario('server-error')) return unavailable()
      if (isScenario('bad-request')) {
        return apiError(400, 'bad_request', 'Parâmetros de busca inválidos.')
      }
      const parsed = nftListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
      if (!parsed.success) {
        return apiError(400, 'bad_request', 'Parâmetros de busca inválidos.', {
          fields: fieldErrors(parsed.error),
        })
      }
      const query = parsed.data
      if (hasInvertedPriceBounds(query.minPrice, query.maxPrice)) {
        return apiError(400, 'bad_request', 'Parâmetros de busca inválidos.', {
          fields: { maxPrice: 'O preço máximo deve ser maior ou igual ao mínimo.' },
        })
      }
      const records = getDb().nfts.all()
      const range = priceRange(records)
      if (isScenario('empty-catalog')) {
        return json(nftListResponseSchema, {
          items: [],
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 0,
          priceRange: range,
        })
      }
      const result = queryCatalog(records, query)
      return json(nftListResponseSchema, {
        ...result,
        page: query.page,
        pageSize: query.pageSize,
        priceRange: range,
      })
    },
    { kind: 'catalog' },
  ),
  apiRoute(
    'get',
    '/nfts/featured',
    () => {
      if (isScenario('server-error')) return unavailable()
      if (isScenario('empty-catalog')) {
        return json(featuredNftsResponseSchema, { hero: [], spotlight: null })
      }
      const records = getDb().nfts.all()
      return json(featuredNftsResponseSchema, {
        hero: heroNfts(records),
        spotlight: spotlightNft(records),
      })
    },
    { kind: 'catalog' },
  ),
  apiRoute(
    'get',
    '/nfts/:id',
    ({ params }) => {
      if (isScenario('server-error')) return unavailable()
      const record = getDb().nfts.findFirst((q) => q.where({ id: String(params.id) }))
      if (!record) return apiError(404, 'not_found', 'NFT não encontrado.')
      return HttpResponse.json(toNftDetail(record))
    },
    { kind: 'catalog' },
  ),
  apiRoute(
    'get',
    '/collections',
    () => {
      if (isScenario('server-error')) return unavailable()
      return json(facetListResponseSchema, { items: collectionFacets(getDb().nfts.all()) })
    },
    { kind: 'catalog' },
  ),
  apiRoute(
    'get',
    '/networks',
    () => {
      if (isScenario('server-error')) return unavailable()
      return json(facetListResponseSchema, { items: networkFacets(getDb().nfts.all()) })
    },
    { kind: 'catalog' },
  ),
]
