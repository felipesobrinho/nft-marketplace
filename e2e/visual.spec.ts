import { expect, test, type Page } from '@playwright/test'
import { addToUserCart, reachReview } from './support/checkout'
import { resetMocks, waitForMocks } from './support/mock'
import { signInThroughApi } from './support/session'

const visualCartItems = [
  { nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 },
  { nftId: 'nft-0088', editionId: 'nft-0088-1-50', quantity: 1 },
]

async function prepareCart(page: Page): Promise<void> {
  await signInThroughApi(page)
  await addToUserCart(page, visualCartItems)
}

async function settle(page: Page): Promise<void> {
  await waitForMocks(page)
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.evaluate(() => {
    for (const image of Array.from(document.images)) {
      if (image.loading === 'lazy') image.loading = 'eager'
    }
  })
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((image) => image.getClientRects().length > 0)
      .every((image) => image.complete && image.naturalWidth > 0),
  )
  await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00-03:00'))
  await resetMocks(page)
})

test('início @visual', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.locator('#catalogo').getByRole('article').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('inicio.png', {
    fullPage: true,
    mask: [page.getByRole('button', { name: 'Demonstração' })],
  })
})

test('detalhe @visual', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('detalhe.png', {
    fullPage: true,
    mask: [page.getByRole('button', { name: 'Demonstração' })],
  })
})

test('carrinho @visual', async ({ page }) => {
  await prepareCart(page)
  await page.goto('/carrinho')
  await expect(page.locator('[data-cart-line]').filter({ visible: true }).first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('carrinho.png', {
    fullPage: true,
    mask: [page.getByRole('button', { name: 'Demonstração' })],
  })
})

test('pagamento, etapa de dados @visual', async ({ page }) => {
  await prepareCart(page)
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { name: 'Dados do colecionador' })).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento-dados.png', {
    fullPage: true,
    mask: [page.getByRole('button', { name: 'Demonstração' })],
  })
})

test('pagamento, revisão @visual', async ({ page }) => {
  await prepareCart(page)
  await reachReview(page)
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento-revisao.png', {
    fullPage: true,
    mask: [page.getByRole('button', { name: 'Demonstração' })],
  })
})
