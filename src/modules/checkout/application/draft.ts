import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useCurrentUserId } from '@/modules/auth'
import { type CheckoutDraft, parseDraft } from '../domain/draft'
import { draftStore } from '../infrastructure/draftStore'

export type DraftChange = (draft: CheckoutDraft) => CheckoutDraft

export function useCheckoutDraft() {
  const userId = useCurrentUserId()
  const raw = useSyncExternalStore(
    (listener) => draftStore.subscribe(listener),
    () => (userId ? draftStore.read(userId) : null),
    () => null,
  )
  const draft = useMemo(() => parseDraft(raw), [raw])

  const update = useCallback(
    (change: DraftChange) => {
      if (!userId) return
      draftStore.write(userId, change(parseDraft(draftStore.read(userId))))
    },
    [userId],
  )

  const reset = useCallback(() => {
    if (userId) draftStore.clear(userId)
  }, [userId])

  return { draft, update, reset }
}

export function discardCheckoutDrafts(keepUserId: string | null): void {
  draftStore.discardAll(keepUserId)
}
