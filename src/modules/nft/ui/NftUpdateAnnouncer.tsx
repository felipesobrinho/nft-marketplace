import { useCallback } from 'react'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { useNftUpdates } from '../application/useNftUpdates'
import { describeNftUpdate } from '@/shared/domain/nftUpdate'

export function NftUpdateAnnouncer() {
  const announce = useAnnounce()
  const handleUpdate = useCallback((event: NftUpdatedEvent) => announce(describeNftUpdate(event)), [announce])
  useNftUpdates(handleUpdate)
  return null
}
