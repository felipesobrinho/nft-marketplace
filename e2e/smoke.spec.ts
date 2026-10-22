import { expect, test } from '@playwright/test'

test('abre o início com o título da página', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Kurio/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('rota inexistente mostra a página 404', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})
