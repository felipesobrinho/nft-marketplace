import { expect, type Page, test } from '@playwright/test'
import { cards, catalog } from './support/catalog'
import { resetMocks, setScenario } from './support/mock'

const skeletons = (page: Page) => catalog(page).locator('[aria-busy="true"] .shimmer')

test('mostra skeleton com shimmer durante a lentidão e depois o conteúdo', async ({ page }) => {
  await resetMocks(page, 'slow')
  await page.reload()
  await expect(skeletons(page).first()).toBeVisible()
  await expect(cards(page)).toHaveCount(9, { timeout: 10_000 })
  await expect(skeletons(page)).toHaveCount(0)
})

test('skeleton sem animação com movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await resetMocks(page, 'slow')
  await page.reload()
  const animation = await skeletons(page)
    .first()
    .evaluate((element) => getComputedStyle(element).animationName)
  expect(animation).toBe('none')
})

test('falha com mensagem e recuperação pela nova tentativa', async ({ page }) => {
  await resetMocks(page, 'server-error')
  await page.reload()
  const retry = catalog(page).getByRole('button', { name: 'Tentar de novo' })
  await expect(retry).toBeVisible({ timeout: 15_000 })
  await expect(catalog(page).getByRole('alert')).toContainText('Não foi possível carregar')
  await setScenario(page, 'default')
  await retry.click()
  await expect(cards(page)).toHaveCount(9)
})

test('catálogo vazio mostra o estado vazio', async ({ page }) => {
  await resetMocks(page, 'empty-catalog')
  await page.reload()
  await expect(catalog(page).getByText('Nenhum NFT encontrado')).toBeVisible()
})
