import { useEffect } from 'react'
import { realtime } from '@/shared/infrastructure/realtime'

export function RealtimeConnection() {
  useEffect(() => {
    const start = () => realtime.start({ token: null, userId: null })
    const idle = window.requestIdleCallback?.(start, { timeout: 1_500 })
    const timer = idle === undefined ? window.setTimeout(start, 0) : undefined
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (timer !== undefined) window.clearTimeout(timer)
      realtime.stop()
    }
  }, [])
  return null
}
