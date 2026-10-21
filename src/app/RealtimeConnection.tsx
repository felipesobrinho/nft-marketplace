import { useEffect } from 'react'
import { useStoredSession } from '@/modules/auth'
import { realtime } from '@/shared/infrastructure/realtime'

export function RealtimeConnection() {
  const session = useStoredSession()
  const token = session?.token ?? null
  const userId = session?.userId ?? null

  useEffect(() => {
    const start = () => realtime.start({ token, userId })
    const idle = window.requestIdleCallback?.(start, { timeout: 1_500 })
    const timer = idle === undefined ? window.setTimeout(start, 0) : undefined
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (timer !== undefined) window.clearTimeout(timer)
      realtime.stop()
    }
  }, [token, userId])

  return null
}
