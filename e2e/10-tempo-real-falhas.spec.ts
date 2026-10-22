import { expect, type Page, test } from '@playwright/test'
import { addToUserCart, confirmButton, reachReview, userOrders } from './support/checkout'
import { call, resetMocks, waitForSocket } from './support/mock'
import { signInThroughApi } from './support/session'

const apeEdition = { nftId: 'nft-0042', editionId: 'nft-0042-1-50' }
const pendingHeading = 'Aguardando confirmação da rede'

async function connections(page: Page): Promise<number> {
  const result = await call<{ connections: number }>(page, '/__mock/realtime')
  return result.body.connections
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await signInThroughApi(page)
  await addToUserCart(page, [{ ...apeEdition, quantity: 2 }])
})

test('evento duplicado ou antigo não reaparece nem muda o resumo', async ({ page }) => {
  await page.goto('/carrinho')
  await waitForSocket(page)
  const summary = page.getByRole('region', { name: 'Resumo do pedido' }).filter({ visible: true }).first()
  await call(page, '/__mock/events/nft-updated', { body: { ...apeEdition, price: '1.5' } })
  const notice = page.locator('[data-cart-notice]')
  await expect(notice).toBeVisible()
  await expect(summary).toContainText('3.00 ETH')
  await notice.getByRole('button', { name: 'Entendi' }).click()
  await expect(notice).toHaveCount(0)

  const duplicate = await call<{ delivered: number }>(page, '/__mock/events/replay', {
    body: { type: 'nft.updated', mode: 'duplicate' },
  })
  const stale = await call<{ delivered: number }>(page, '/__mock/events/replay', {
    body: { type: 'nft.updated', mode: 'stale' },
  })
  expect(duplicate.body.delivered).toBeGreaterThan(0)
  expect(stale.body.delivered).toBeGreaterThan(0)
  await page.waitForTimeout(500)
  await expect(notice).toHaveCount(0)
  await expect(summary).toContainText('3.00 ETH')
})

test('a conexão cai com o pedido pendente e a reconexão recupera sem nova compra', async ({ page }) => {
  await reachReview(page)
  await waitForSocket(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: pendingHeading })).toBeVisible()

  const closed = await call<{ closed: number }>(page, '/__mock/realtime/disconnect', { body: {} })
  expect(closed.body.closed).toBeGreaterThan(0)
  await expect.poll(() => connections(page), { timeout: 10_000 }).toBeGreaterThan(0)

  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
    timeout: 10_000,
  })
  const orders = await userOrders(page)
  expect(orders).toHaveLength(1)
  expect(orders[0]?.status).toBe('confirmed')
})

test('evento de pedido pelo socket encerra o pendente com o resultado', async ({ page }) => {
  await reachReview(page)
  await waitForSocket(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: pendingHeading })).toBeVisible()
  const orderId = new URL(page.url()).pathname.split('/').pop() ?? ''

  const result = await call(page, '/__mock/events/order-updated', {
    body: { orderId, status: 'refused', reason: 'Carteira sem saldo para a taxa de rede.' },
  })
  expect(result.status).toBe(200)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByText('Carteira sem saldo para a taxa de rede.')).toBeVisible()

  await page.waitForTimeout(3_500)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  const orders = await userOrders(page)
  expect(orders[0]?.status).toBe('refused')
})
