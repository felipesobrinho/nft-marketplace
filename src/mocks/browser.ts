import { setupWorker } from 'msw/browser'
import { controlHandlers } from './control/handlers'
import { openDb } from './db'
import { nftHandlers } from './handlers/nfts'
import { createRealtimeHandler } from './realtime/hub'

export async function startMocks(): Promise<void> {
  await openDb()
  const worker = setupWorker(
    ...controlHandlers,
    ...nftHandlers,
    createRealtimeHandler({ resolveUser: () => null, acceptConnections: () => true }),
  )
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
