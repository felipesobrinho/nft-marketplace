import { queryOptions } from '@tanstack/react-query'
import { realtime } from '@/shared/infrastructure/realtime'
import { fetchNft } from '../infrastructure/nftApi'

export const nftKeys = {
  all: ['nft'] as const,
  detail: (nftId: string) => [...nftKeys.all, nftId] as const,
}

export function nftDetailQuery(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: async ({ signal }) => {
      const nft = await fetchNft(nftId, signal)
      realtime.observe('nft', nft.id, nft.version)
      return nft
    },
  })
}
