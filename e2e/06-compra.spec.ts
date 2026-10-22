import { expect, test } from '@playwright/test'
import { cards } from './support/catalog'
import {
  confirmButton,
  connectWallet,
  fillBuyer,
  reachReview,
  addToUserCart,
  userCartCount,
  userOrders,
} from './support/checkout'
import { resetMocks, waitForMocks } from './support/mock'
import { signInThroughApi } from './support/session'

const pendingHeading = 'Aguardando confirmação da rede'
const confirmedHeading = 'Seus NFTs agora estão na sua carteira'

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await signInThroughApi(page)
})

test('compra completa do catálogo ao recibo', async ({ page }) => {
  await cards(page).filter({ hasText: 'Emerald Ape #042' }).first().getByRole('link').first().click()
  await expect(page).toHaveURL(/\/nft\/nft-0042/)
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).filter({ visible: true }).first().click()
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()

  await page.goto('/carrinho')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL('/pagamento')

  await fillBuyer(page)
  await connectWallet(page)
  await page.getByRole('button', { name: 'Continuar para a revisão' }).click()
  await expect(page.getByRole('heading', { name: 'Revisão' })).toBeVisible()
  await expect(page.getByText('Emerald Ape #042').first()).toBeVisible()

  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedidos\/ord-/)
  await expect(page.getByRole('heading', { name: pendingHeading })).toBeVisible()
  await expect(page.getByRole('heading', { name: confirmedHeading })).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('[data-purchase-line]').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
  await expect(page.getByText(/Transação confirmada na Ethereum/)).toBeVisible()

  await page.getByRole('button', { name: 'Ver no explorador (simulado)' }).click()
  await expect(
    page.getByRole('dialog').getByText('Referência simulada. Nenhum site externo é aberto.'),
  ).toBeVisible()
  await page.keyboard.press('Escape')

  expect(await userCartCount(page)).toBe(0)
  const orders = await userOrders(page)
  expect(orders).toHaveLength(1)
  expect(orders[0]?.status).toBe('confirmed')
})

test('pedido pendente continua depois do refresh e confirma sozinho', async ({ page }) => {
  await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 }])
  await reachReview(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: pendingHeading })).toBeVisible()
  const url = page.url()

  await page.reload()
  await waitForMocks(page)
  expect(page.url()).toBe(url)
  await expect(page.getByRole('heading', { name: confirmedHeading })).toBeVisible({ timeout: 10_000 })
  expect(await userCartCount(page)).toBe(0)
})

test('o recibo guarda o valor pago mesmo se o catálogo mudar depois', async ({ page }) => {
  await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 }])
  await reachReview(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: confirmedHeading })).toBeVisible({ timeout: 10_000 })
  const receipt = page.locator('[data-purchase-line]').filter({ hasText: 'Emerald Ape #042' })
  await expect(receipt).toContainText('2.38 ETH')

  const changed = await page.evaluate(async () => {
    const response = await fetch('/__mock/events/nft-updated', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nftId: 'nft-0042', editionId: 'nft-0042-1-50', price: '3.5' }),
    })
    return response.status
  })
  expect(changed).toBe(200)
  await page.reload()
  await waitForMocks(page)
  await expect(receipt).toContainText('2.38 ETH')
})
