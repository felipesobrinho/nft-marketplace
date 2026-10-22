import { expect, type Page, test } from '@playwright/test'
import { cards } from './support/catalog'
import { resetMocks, setScenario, waitForMocks } from './support/mock'
import { signInThroughApi } from './support/session'

const favoriteOn = (page: Page) =>
  page
    .getByRole('button', { name: /Emerald Ape #042/, pressed: true })
    .filter({ visible: true })
    .first()
const favoriteOff = (page: Page) =>
  page
    .getByRole('button', { name: /Favoritar Emerald Ape #042|^Favoritar/, pressed: false })
    .filter({ visible: true })
    .first()

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('visitante que tenta favoritar vai para o login e volta depois', async ({ page }) => {
  await page.goto('/nft/nft-0042')
  await favoriteOff(page).click()
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fnft%2Fnft-0042/)
})

test('favorito aparece na hora, persiste e pode ser desfeito', async ({ page }) => {
  await signInThroughApi(page)
  await page.goto('/nft/nft-0042')
  await favoriteOff(page).click()
  await expect(favoriteOn(page)).toBeVisible()
  await expect(favoriteOn(page)).toHaveAttribute('aria-busy', 'false')
  await page.reload()
  await waitForMocks(page)
  await expect(favoriteOn(page)).toBeVisible()
  await favoriteOn(page).click()
  await expect(favoriteOff(page)).toBeVisible()
})

test('falha ao favoritar desfaz a mudança otimista e recupera na nova tentativa', async ({ page }) => {
  await signInThroughApi(page)
  await page.goto('/nft/nft-0042')
  await setScenario(page, 'favorite-failure')
  await favoriteOff(page).click()
  await expect(favoriteOn(page)).toBeVisible()
  await expect(page.getByText('Não foi possível atualizar o favorito. Tente de novo.')).toBeVisible()
  await expect(favoriteOff(page)).toBeVisible()

  await setScenario(page, 'default')
  await favoriteOff(page).click()
  await expect(favoriteOn(page)).toBeVisible()
  await expect(favoriteOn(page)).toHaveAttribute('aria-busy', 'false')
  await page.reload()
  await waitForMocks(page)
  await expect(favoriteOn(page)).toBeVisible()
})

test('favorita direto do card do catálogo', async ({ page }) => {
  await signInThroughApi(page)
  await page.goto('/')
  const heart = cards(page).first().getByRole('button', { name: 'Favoritar Emerald Ape #042' })
  await heart.click()
  await expect(
    cards(page).first().getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }),
  ).toHaveAttribute('aria-pressed', 'true')
})
