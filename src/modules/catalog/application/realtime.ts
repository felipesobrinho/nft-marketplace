import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { FeaturedNftsResponse, NftListResponse } from '@/shared/contracts/catalog'
import { applyNftUpdate, applyNftUpdateToList } from '@/shared/domain/nftUpdate'
import { realtime } from '@/shared/infrastructure/realtime'
import { catalogKeys } from './queries'

export function useCatalogRealtime(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const offUpdate = realtime.subscribe('nft.updated', (event) => {
      queryClient.setQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() }, (list) =>
        list ? { ...list, items: applyNftUpdateToList(list.items, event) } : list,
      )
      queryClient.setQueryData<FeaturedNftsResponse>(catalogKeys.featured(), (featured) =>
        featured
          ? {
              hero: applyNftUpdateToList(featured.hero, event),
              spotlight: featured.spotlight ? applyNftUpdate(featured.spotlight, event) : null,
            }
          : featured,
      )
      void queryClient.invalidateQueries({ queryKey: catalogKeys.lists(), refetchType: 'none' })
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    })
    return () => {
      offUpdate()
      offReconnect()
    }
  }, [queryClient])
}
