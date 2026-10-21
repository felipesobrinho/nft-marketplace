import { useEffect } from 'react'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { realtime } from '@/shared/infrastructure/realtime'

export function useNftUpdates(onUpdate: (event: NftUpdatedEvent) => void): void {
  useEffect(() => realtime.subscribe('nft.updated', onUpdate), [onUpdate])
}
