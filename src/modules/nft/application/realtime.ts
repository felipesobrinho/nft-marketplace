import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { NftDetail } from '@/shared/contracts/catalog'
import { applyNftUpdateToDetail } from '@/shared/domain/nftUpdate'
import { realtime } from '@/shared/infrastructure/realtime'
import { nftKeys } from './queries'

export function useNftRealtime(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const offUpdate = realtime.subscribe('nft.updated', (event) => {
      queryClient.setQueryData<NftDetail>(nftKeys.detail(event.resource.id), (detail) =>
        detail ? applyNftUpdateToDetail(detail, event) : detail,
      )
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
    })
    return () => {
      offUpdate()
      offReconnect()
    }
  }, [queryClient])
}
