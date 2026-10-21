import { nftDetailSchema } from '@/shared/contracts/catalog'
import { request } from '@/shared/infrastructure/http'

export function fetchNft(nftId: string, signal?: AbortSignal) {
  return request(nftDetailSchema, { url: `/nfts/${encodeURIComponent(nftId)}`, signal })
}
