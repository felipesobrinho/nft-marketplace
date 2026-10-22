import { http } from 'msw'
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
  const dbReady = openDb().then(() => resumePendingSettlements())
  const waitForDb = async () => {
    await dbReady
  }
  const worker = setupWorker(
    http.all('/api/*', waitForDb),
    http.all('/__mock/*', waitForDb),
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
  await Promise.all([
    dbReady,
    worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
      serviceWorker: { url: '/mockServiceWorker.js' },
    }),
  ])
}
