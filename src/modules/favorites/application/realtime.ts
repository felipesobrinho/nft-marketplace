import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useCurrentUserId } from '@/modules/auth'
import type { NftSummary } from '@/shared/contracts/catalog'
import { applyNftUpdateToList } from '@/shared/domain/nftUpdate'
import { realtime } from '@/shared/infrastructure/realtime'
import { favoriteKeys } from './favorites'

export function useFavoritesRealtime(): void {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return
    const key = favoriteKeys.list(userId)
    const offUpdate = realtime.subscribe('nft.updated', (event) => {
      queryClient.setQueryData<{ items: NftSummary[] }>(key, (list) =>
        list ? { items: applyNftUpdateToList(list.items, event) } : list,
      )
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: key })
    })
    return () => {
      offUpdate()
      offReconnect()
    }
  }, [queryClient, userId])
}
