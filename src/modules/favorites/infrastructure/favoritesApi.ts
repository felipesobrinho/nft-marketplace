import { favoriteListResponseSchema, favoriteStateSchema } from '@/shared/contracts/commerce'
import { request } from '@/shared/infrastructure/http'

export function fetchFavorites(signal?: AbortSignal) {
  return request(favoriteListResponseSchema, { url: '/favorites', signal })
}

export function addFavorite(nftId: string) {
  return request(favoriteStateSchema, { url: `/favorites/${nftId}`, method: 'PUT' })
}

export function removeFavorite(nftId: string) {
  return request(favoriteStateSchema, { url: `/favorites/${nftId}`, method: 'DELETE' })
}
