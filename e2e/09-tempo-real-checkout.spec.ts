import { expect, type Page, test } from '@playwright/test'
import { cards } from './support/catalog'
import { addToUserCart, confirmButton, reachReview, userOrders } from './support/checkout'
import { call, resetMocks, waitForSocket } from './support/mock'
import { signInThroughApi } from './support/session'

async function emitNftUpdate(page: Page, body: Record<string, unknown>): Promise<void> {
  const result = await call<{ delivered: number }>(page, '/__mock/events/nft-updated', { body })
  expect(result.status).toBe(200)
  expect(result.body.delivered).toBeGreaterThan(0)
}

const apeEdition = { nftId: 'nft-0042', editionId: 'nft-0042-1-50' }

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('preço muda no catálogo sem recarregar a página', async ({ page }) => {
  await waitForSocket(page)
  const ape = cards(page).filter({ hasText: 'Emerald Ape #042' }).first()
  await expect(ape).toContainText('1.19 ETH')
  await emitNftUpdate(page, { ...apeEdition, price: '1.29' })
  await expect(ape).toContainText('1.29 ETH')
  await expect(page.getByRole('status').filter({ hasText: 'O preço de Emerald Ape #042 mudou' })).toHaveCount(
    1,
  )
})

test('no detalhe, preço e disponibilidade da edição mudam pelo socket', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await waitForSocket(page)
  const edition = page.getByRole('button', { name: /^1\/50/ }).filter({ visible: true })
  await expect(edition).toHaveAttribute('aria-pressed', 'true')
  await emitNftUpdate(page, { ...apeEdition, price: '1.29' })
  await expect(page.getByText('1.29 ETH').filter({ visible: true }).first()).toBeVisible()
  await emitNftUpdate(page, { ...apeEdition, available: 0 })
  await expect(edition).toBeDisabled()
  await expect(edition).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page
      .getByRole('button', { name: /Edição esgotada/ })
      .filter({ visible: true })
      .first(),
  ).toBeDisabled()
})

test('com o item no carrinho, a mudança de preço aparece e o resumo é recalculado', async ({ page }) => {
  await signInThroughApi(page)
  await addToUserCart(page, [{ ...apeEdition, quantity: 2 }])
  await page.goto('/carrinho')
  await waitForSocket(page)
  const summary = page.getByRole('region', { name: 'Resumo do pedido' }).filter({ visible: true }).first()
  await expect(summary).toContainText('2.38 ETH')
  await emitNftUpdate(page, { ...apeEdition, price: '1.5' })
  await expect(page.locator('[data-cart-notice]')).toContainText(
    'O preço de Emerald Ape #042 (1/50) mudou de 1.19 ETH para 1.50 ETH. Os valores do carrinho foram atualizados.',
  )
  await expect(summary).toContainText('3.00 ETH')
})

test('no checkout, preço novo pelo socket exige nova confirmação e vale no pedido', async ({ page }) => {
  await signInThroughApi(page)
  await addToUserCart(page, [{ ...apeEdition, quantity: 2 }])
  await reachReview(page)
  await waitForSocket(page)
  await emitNftUpdate(page, { ...apeEdition, price: '1.5' })
  const alert = page.getByRole('alert').filter({ hasText: 'Os valores mudaram enquanto você revisava' })
  await expect(alert).toContainText('preço de 1.19 ETH para 1.50 ETH')
  await page.getByRole('button', { name: 'Confirmar com os novos valores' }).click()
  await expect(page).toHaveURL(/\/pedidos\/ord-/)
  await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.locator('[data-purchase-line]').filter({ hasText: 'Emerald Ape #042' })).toContainText(
    '3.00 ETH',
  )
  expect(await userOrders(page)).toHaveLength(1)
})

test('no checkout, edição esgotada pelo socket bloqueia a compra', async ({ page }) => {
  await signInThroughApi(page)
  await addToUserCart(page, [{ ...apeEdition, quantity: 2 }])
  await reachReview(page)
  await waitForSocket(page)
  await emitNftUpdate(page, { ...apeEdition, available: 0 })
  await expect(page.getByRole('link', { name: 'Ajustar carrinho' })).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
  expect(await userOrders(page)).toHaveLength(0)
})
