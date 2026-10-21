import { setupWorker } from 'msw/browser'
import { controlHandlers } from './control/handlers'
import { openDb } from './db'
import { authHandlers } from './handlers/auth'
import { cartHandlers } from './handlers/cart'
import { favoriteHandlers } from './handlers/favorites'
import { nftHandlers } from './handlers/nfts'
import { orderHandlers } from './handlers/orders'
import { profileHandlers } from './handlers/profile'
import { quoteHandlers } from './handlers/quotes'
import { userIdForToken } from './handlers/session'
import { walletHandlers } from './handlers/wallets'
import { createRealtimeHandler } from './realtime/hub'
import { initScenario, isScenario } from './scenarios/state'
import { resumePendingSettlements } from './services/orders'

export async function startMocks(): Promise<void> {
  initScenario()
  await openDb()
  resumePendingSettlements()
  const worker = setupWorker(
    ...controlHandlers,
    ...authHandlers,
    ...nftHandlers,
    ...favoriteHandlers,
    ...cartHandlers,
    ...quoteHandlers,
    ...orderHandlers,
    ...profileHandlers,
    ...walletHandlers,
    createRealtimeHandler({
      resolveUser: userIdForToken,
      acceptConnections: () => !isScenario('offline'),
    }),
  )
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
