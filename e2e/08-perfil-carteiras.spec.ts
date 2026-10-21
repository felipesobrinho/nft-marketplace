import { expect, type Locator, type Page, test } from '@playwright/test'
import { call, resetMocks, setScenario, waitForMocks } from './support/mock'
import { ana, bruno, signInThroughApi } from './support/session'

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 1440) >= 768
const main = (page: Page) => page.locator('main')
const section = (page: Page, title: string): Locator =>
  main(page)
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    .first()

async function openProfile(page: Page) {
  await page.goto('/conta/perfil')
  await waitForMocks(page)
  await expect(main(page).getByLabel(/^Nome de exibição/)).toHaveValue(/.+/)
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('edita o perfil, o nome muda no header e continua depois do refresh', async ({ page }) => {
  await signInThroughApi(page)
  await openProfile(page)
  await main(page)
    .getByLabel(/^Nome de exibição/)
    .fill('Ana Lima Souza')
  await main(page).getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil salvo.')).toBeVisible()
  if (isDesktop(page)) {
    await expect(page.getByRole('button', { name: 'Conta de Ana Lima Souza' })).toBeVisible()
  }
  await page.reload()
  await waitForMocks(page)
  await expect(main(page).getByLabel(/^Nome de exibição/)).toHaveValue('Ana Lima Souza')
})

test('e-mail de outra conta mostra o erro da API no campo', async ({ page }) => {
  await signInThroughApi(page)
  await openProfile(page)
  const email = main(page).getByLabel(/^E-mail/)
  await email.fill(bruno.email)
  await main(page).getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(main(page).getByText('Este e-mail já tem cadastro.')).toBeVisible()
})

test('avatar recusa formato inválido, aceita PNG e pode ser removido', async ({ page }) => {
  await signInThroughApi(page)
  await openProfile(page)
  const picker = main(page).getByLabel('Escolher imagem do avatar')
  await picker.setInputFiles({ name: 'avatar.gif', mimeType: 'image/gif', buffer: tinyPng })
  await expect(
    main(page).getByRole('alert').filter({ hasText: 'Envie uma imagem PNG, JPEG ou WebP.' }),
  ).toBeVisible()

  await picker.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: tinyPng })
  await expect(page.getByText('Avatar atualizado.')).toBeVisible()
  const remove = main(page).getByRole('button', { name: 'Remover' })
  await expect(remove).toBeEnabled()

  await page.reload()
  await waitForMocks(page)
  await expect(main(page).getByRole('button', { name: 'Remover' })).toBeEnabled()
  await main(page).getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('Avatar removido.')).toBeVisible()
  await expect(main(page).getByRole('button', { name: 'Remover' })).toBeDisabled()
})

test('senha atual errada aparece no campo; a troca vale no próximo login', async ({ page }) => {
  await signInThroughApi(page)
  await openProfile(page)
  const current = main(page).getByLabel(/^Senha atual/)
  await current.fill('Errada@123')
  await main(page)
    .getByLabel(/^Nova senha/)
    .fill('Nova@1234')
  await main(page)
    .getByLabel(/^Confirmar nova senha/)
    .fill('Nova@1234')
  await main(page).getByRole('button', { name: 'Alterar senha' }).click()
  await expect(current).toHaveAttribute('aria-invalid', 'true')
  await expect(main(page).getByText('Senha atual incorreta.')).toBeVisible()

  await current.fill(ana.password)
  await main(page).getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('Senha alterada.')).toBeVisible()
  await expect(current).toHaveValue('')

  const oldLogin = await call(page, '/api/auth/login', { body: { email: ana.email, password: ana.password } })
  expect(oldLogin.status).toBe(401)
  const newLogin = await call(page, '/api/auth/login', { body: { email: ana.email, password: 'Nova@1234' } })
  expect(newLogin.status).toBe(200)
})

test('edita a carteira secundária com erro de endereço e salva', async ({ page }) => {
  await signInThroughApi(page)
  await page.goto('/conta/carteiras')
  await waitForMocks(page)
  const secondary = section(page, 'Carteira secundária')
  await expect(secondary.getByText('Reserva').first()).toBeVisible()
  await secondary.getByRole('button', { name: 'Editar' }).click()

  const address = secondary.getByLabel(/^Endereço/)
  await address.fill('abc')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(address).toHaveAttribute('aria-invalid', 'true')
  await expect(secondary.getByText(/0x e ter 40 caracteres/)).toBeVisible()

  await address.fill('0x1234567890abcdef1234567890abcdef12345678')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()
  await expect(secondary.getByText('0x1234…5678')).toBeVisible()

  await page.reload()
  await waitForMocks(page)
  await expect(section(page, 'Carteira secundária').getByText('0x1234…5678')).toBeVisible()
})

test('usuário sem carteiras cadastra a principal', async ({ page }) => {
  await signInThroughApi(page, bruno)
  await page.goto('/conta/carteiras')
  await waitForMocks(page)
  const primary = section(page, 'Carteira principal')
  await expect(primary.getByText('Você ainda não adicionou uma carteira principal.')).toBeVisible()
  await primary.getByRole('button', { name: 'Adicionar' }).click()

  await primary.getByLabel(/^Apelido/).fill('Cofre')
  await primary.getByRole('combobox', { name: /^Rede/ }).click()
  await page.getByRole('option', { name: 'Polygon' }).click()
  await primary.getByLabel(/^Endereço/).fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
  await primary.getByRole('combobox', { name: /^Tipo/ }).click()
  await page.getByRole('option', { name: 'Coinbase Wallet' }).click()
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()

  await expect(page.getByText('Carteira salva.')).toBeVisible()
  await expect(primary.getByText('Cofre').first()).toBeVisible()
  await expect(primary.getByRole('button', { name: 'Editar' })).toBeVisible()
})

test('sem permissão, perfil e carteiras mostram o erro com nova tentativa', async ({ page }) => {
  await signInThroughApi(page)
  await setScenario(page, 'forbidden')
  await page.goto('/conta/perfil')
  await waitForMocks(page)
  await expect(main(page).getByText('Você não tem permissão para ver este perfil.')).toBeVisible()
  await page.goto('/conta/carteiras')
  await waitForMocks(page)
  await expect(main(page).getByText('Você não tem permissão para ver as carteiras.')).toBeVisible()
})

test('lista de interesse mostra os favoritos e tira o que for desfavoritado', async ({ page }) => {
  await signInThroughApi(page)
  await page.goto('/conta/favoritos')
  await waitForMocks(page)
  const card = main(page).getByRole('article').filter({ hasText: 'Sage Nomad #009' })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Remover Sage Nomad #009 dos favoritos' }).click()
  await expect(card).toHaveCount(0)
  await page.reload()
  await waitForMocks(page)
  await expect(main(page).getByRole('article').filter({ hasText: 'Sage Nomad #009' })).toHaveCount(0)
})

test('no mobile o menu da conta vira abas e dá para sair', async ({ page }) => {
  test.skip(isDesktop(page), 'abas só no mobile')
  await signInThroughApi(page)
  await page.goto('/conta/perfil')
  await waitForMocks(page)
  await main(page).getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL('/conta/carteiras')
  await main(page).getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL('/')
  expect(await page.evaluate(() => localStorage.getItem('kurio:session'))).toBeNull()
})

test('no desktop o menu lateral marca a página atual e os itens fora do escopo avisam', async ({ page }) => {
  test.skip(!isDesktop(page), 'menu lateral só no desktop')
  await signInThroughApi(page)
  await page.goto('/conta/carteiras')
  await waitForMocks(page)
  const nav = page.getByRole('navigation', { name: 'Conta' })
  await expect(nav.getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('button', { name: 'Ofertas' }).click()
  await expect(page.getByRole('dialog').getByText(/Indisponível nesta demonstração/i)).toBeVisible()
})
