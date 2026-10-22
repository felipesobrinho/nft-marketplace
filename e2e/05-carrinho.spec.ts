import { expect, type Page, test } from '@playwright/test'
import { seedGuestCart } from './support/cart'
import { resetMocks, waitForMocks } from './support/mock'
import { ana } from './support/session'

const line = (page: Page, name: string) =>
  page.locator('[data-cart-line]').filter({ hasText: name }).filter({ visible: true }).first()
const summary = (page: Page) =>
  page.getByRole('region', { name: 'Resumo do pedido' }).filter({ visible: true }).first()

async function openCartWithItems(page: Page) {
  await seedGuestCart(page, [
    { nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 },
    { nftId: 'nft-0088', editionId: 'nft-0088-1-50', quantity: 1 },
  ])
  await page.goto('/carrinho')
  await waitForMocks(page)
  await expect(line(page, 'Emerald Ape #042')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('mostra itens e o resumo calculado pela API', async ({ page }) => {
  await openCartWithItems(page)
  await expect(line(page, 'Ivory Baron #088')).toBeVisible()
  await expect(summary(page)).toContainText('Subtotal')
  await expect(summary(page)).toContainText('4.170 ETH')
  await expect(summary(page)).toContainText('0.016 ETH')
  await expect(summary(page)).toContainText('4.186 ETH')
})

test('altera quantidade até o limite e remove item', async ({ page }) => {
  await openCartWithItems(page)
  const ape = line(page, 'Emerald Ape #042')
  const increase = ape.getByRole('button', { name: 'Aumentar quantidade' })
  await increase.click()
  await expect(ape.locator('output')).toHaveText('3')
  await expect(summary(page)).toContainText('5.360 ETH')
  await increase.click()
  await increase.click()
  await expect(ape.locator('output')).toHaveText('5')
  await expect(increase).toBeDisabled()

  await line(page, 'Ivory Baron #088')
    .getByRole('button', { name: 'Remover Ivory Baron #088 do carrinho' })
    .click()
  await expect(page.locator('[data-cart-line]').filter({ hasText: 'Ivory Baron #088' })).toHaveCount(0)
})

test('cupom inválido, expirado e válido', async ({ page }) => {
  await openCartWithItems(page)
  const code = page.getByLabel('Código promocional').filter({ visible: true }).first()
  const apply = page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true }).first()

  await code.fill('NADA')
  await apply.click()
  await expect(page.getByText('Cupom inválido.').filter({ visible: true }).first()).toBeVisible()

  await code.fill('VELHO20')
  await apply.click()
  await expect(page.getByText('Este cupom expirou.').filter({ visible: true }).first()).toBeVisible()

  await code.fill('jungle10')
  await apply.click()
  await expect(summary(page)).toContainText('JUNGLE10')
  await expect(summary(page)).toContainText('-0.417 ETH')
  await expect(summary(page)).toContainText('3.769 ETH')
})

test('o carrinho sobrevive ao refresh e é mesclado no login', async ({ page }) => {
  await openCartWithItems(page)
  await page.reload()
  await waitForMocks(page)
  await expect(line(page, 'Emerald Ape #042')).toBeVisible()
  await expect(line(page, 'Ivory Baron #088')).toBeVisible()

  await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
  const form = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: /^Entrar$/ }) })
    .filter({ visible: true })
    .first()
  await form.getByLabel('E-mail').fill(ana.email)
  await form.getByLabel(/^Senha/).fill(ana.password)
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/pagamento')

  await page.goto('/carrinho')
  await waitForMocks(page)
  await expect(line(page, 'Emerald Ape #042')).toBeVisible()
  await expect(line(page, 'Ivory Baron #088')).toBeVisible()
})
