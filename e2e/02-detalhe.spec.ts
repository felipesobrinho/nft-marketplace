import { expect, type Page, test } from '@playwright/test'
import { resetMocks, waitForMocks } from './support/mock'

function chip(page: Page, label: RegExp) {
  return page.getByRole('button', { name: label }).filter({ visible: true })
}

function stepper(page: Page) {
  return page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true }).first()
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('acesso direto ao detalhe mostra o NFT e sobrevive ao refresh', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page).toHaveTitle('Emerald Ape #042 | Kurio')
  await page.reload()
  await waitForMocks(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
})

test('edição esgotada fica desabilitada e trocar de edição muda o preço', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await expect(chip(page, /^1\/1(\s|$)/)).toBeDisabled()
  await expect(chip(page, /^1\/50/)).toHaveAttribute('aria-pressed', 'true')
  await chip(page, /^1\/10/).click()
  await expect(chip(page, /^1\/10/)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('1.59 ETH').filter({ visible: true }).first()).toBeVisible()
})

test('o seletor de quantidade respeita o mínimo e o limite da edição', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await chip(page, /^1\/10/).click()
  const group = stepper(page)
  const decrease = group.getByRole('button', { name: 'Diminuir quantidade' })
  const increase = group.getByRole('button', { name: 'Aumentar quantidade' })
  await expect(decrease).toBeDisabled()
  await increase.click()
  await increase.click()
  await expect(group.locator('output')).toHaveText('3')
  await expect(increase).toBeDisabled()
  await expect(decrease).toBeEnabled()
})

test('edição com limite 1 desabilita o seletor e mostra o motivo', async ({ page }) => {
  await page.goto('/nft/nft-0314')
  const group = stepper(page)
  await expect(group.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
  await expect(group.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  await expect(
    page.getByText('Limite de 1 por pedido nesta edição').filter({ visible: true }).first(),
  ).toBeVisible()
})

test('adiciona ao carrinho como visitante e atualiza o contador', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  const group = stepper(page)
  await group.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).filter({ visible: true }).first().click()
  await expect(page.getByText('Adicionado ao carrinho')).toBeVisible()
  if ((page.viewportSize()?.width ?? 1440) >= 768) {
    await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
  }
})

test('NFT inexistente mostra o aviso e volta ao catálogo', async ({ page }) => {
  await page.goto('/nft/nft-9999')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
  await expect(page).toHaveURL(/\/#catalogo$|\/$/)
})
