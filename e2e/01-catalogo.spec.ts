import { expect, test } from '@playwright/test'
import { apiTotal, cards, catalog, expectSearch, pick } from './support/catalog'
import { resetMocks, setScenario } from './support/mock'

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('filtros combinados ficam na URL e batem com a API', async ({ page }) => {
  await expect(cards(page)).toHaveCount(9)
  await pick(page, /^Música/)
  await expectSearch(page, { collection: 'musica', network: null })
  await pick(page, /^Polygon/)
  await expectSearch(page, { collection: 'musica', network: 'polygon' })

  const total = await apiTotal(page, 'collection=musica&network=polygon')
  await expect(catalog(page).getByText(`${total} resultados`)).toBeVisible()
  await expect(cards(page)).toHaveCount(Math.min(total, 9))
})

test('ordenação por menor preço muda a URL e a ordem', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Ordenar por' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()
  await expectSearch(page, { sort: 'price_asc' })
  await expect(cards(page).first()).toContainText('0.02 ETH')
})

test('paginação, histórico e refresh restauram o mesmo estado', async ({ page }) => {
  const firstName = await cards(page).first().getByRole('link').innerText()
  await page.getByRole('link', { name: 'Página 2' }).click()
  await expectSearch(page, { page: '2' })
  await expect(cards(page).first().getByRole('link')).not.toHaveText(firstName)
  const secondPageName = await cards(page).first().getByRole('link').innerText()

  await page.goBack()
  await expectSearch(page, { page: null })
  await expect(cards(page).first().getByRole('link')).toHaveText(firstName)

  await page.goForward()
  await expectSearch(page, { page: '2' })
  await page.reload()
  await expect(cards(page).first().getByRole('link')).toHaveText(secondPageName)
  await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
})

test('mudar filtro volta para a página 1', async ({ page }) => {
  await page.goto('/?page=3')
  await expect(cards(page)).toHaveCount(9)
  await pick(page, /^Ethereum/)
  await expectSearch(page, { network: 'ethereum', page: null })
})

test('busca por texto filtra o catálogo', async ({ page }) => {
  const search = page
    .getByRole('search')
    .filter({ visible: true })
    .getByRole('searchbox')
    .or(page.getByRole('search').filter({ visible: true }).getByRole('textbox'))
  const toggle = page.getByRole('button', { name: 'Buscar NFTs' })
  if (await toggle.isVisible()) await toggle.click()
  await search.first().fill('golden')
  await search.first().press('Enter')
  await expectSearch(page, { q: 'golden' })
  const total = await apiTotal(page, 'q=golden')
  await expect(catalog(page).getByText(`${total} resultados`)).toBeVisible()
  for (const name of await cards(page).getByRole('link').allInnerTexts()) expect(name).toMatch(/golden/i)
})

test('resposta antiga que chega depois é descartada', async ({ page }) => {
  await setScenario(page, 'out-of-order')
  await page.reload()
  await expect(cards(page)).toHaveCount(9)
  await pick(page, /^Solana/)
  await pick(page, /^Solana/)
  await pick(page, /^Polygon/)
  await expectSearch(page, { network: 'polygon' })
  const total = await apiTotal(page, 'network=polygon')
  await expect(catalog(page).getByText(`${total} resultados`)).toBeVisible()
  await page.waitForTimeout(1_800)
  await expect(catalog(page).getByText(`${total} resultados`)).toBeVisible()
})
