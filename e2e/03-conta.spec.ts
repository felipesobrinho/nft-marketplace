import { expect, type Page, test } from '@playwright/test'
import { cards } from './support/catalog'
import { resetMocks, setScenario, waitForMocks } from './support/mock'
import { ana, bruno } from './support/session'

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 1440) >= 768
const form = (page: Page) =>
  page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: /^(Entrar|Criar conta|Entrando…|Criando conta…)$/ }) })
    .filter({ visible: true })
    .first()

async function fillLogin(page: Page, email: string, password: string) {
  await form(page).getByLabel('E-mail').fill(email)
  await form(page)
    .getByLabel(/^Senha/)
    .fill(password)
  await form(page).getByRole('button', { name: 'Entrar' }).click()
}

async function openAccountMenu(page: Page, name: string) {
  await page.getByRole('button', { name: `Conta de ${name}` }).click()
}

async function logout(page: Page, name: string) {
  await openAccountMenu(page, name)
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
})

test('cadastro valida os campos e cria a conta', async ({ page }) => {
  await page.goto('/cadastro')
  await form(page).getByRole('button', { name: 'Criar conta' }).click()
  await expect(form(page).getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  await expect(form(page).getByLabel('Nome de usuário')).toBeFocused()

  await form(page).getByLabel('Nome de usuário').fill('carla.dias')
  await form(page).getByLabel('E-mail').fill('carla@jungle.test')
  await form(page)
    .getByLabel(/^Senha/)
    .fill('Senha@123')
  await form(page)
    .getByLabel(/^Confirmar senha/)
    .fill('Senha@124')
  await form(page).getByRole('button', { name: 'Criar conta' }).click()
  await expect(form(page).getByText('As senhas não conferem')).toBeVisible()

  await form(page)
    .getByLabel(/^Confirmar senha/)
    .fill('Senha@123')
  await form(page).getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL('/')
  if (isDesktop(page)) await expect(page.getByRole('button', { name: 'Conta de carla.dias' })).toBeVisible()
})

test('cadastro com e-mail já usado mostra o erro da API no campo', async ({ page }) => {
  await page.goto('/cadastro')
  await form(page).getByLabel('Nome de usuário').fill('outra.ana')
  await form(page).getByLabel('E-mail').fill(ana.email)
  await form(page)
    .getByLabel(/^Senha/)
    .fill('Senha@123')
  await form(page)
    .getByLabel(/^Confirmar senha/)
    .fill('Senha@123')
  await form(page).getByRole('button', { name: 'Criar conta' }).click()
  await expect(form(page).getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
  await expect(form(page).getByText('Este e-mail já tem cadastro.')).toBeVisible()
})

test('rota privada leva ao login e volta depois de entrar; refresh mantém a sessão', async ({ page }) => {
  await page.goto('/conta/perfil')
  await expect(page).toHaveURL(/\/entrar\?redirect=%2Fconta%2Fperfil/)
  await fillLogin(page, ana.email, 'errada')
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
  await fillLogin(page, ana.email, ana.password)
  await expect(page).toHaveURL('/conta/perfil')
  await page.reload()
  await waitForMocks(page)
  await expect(page).toHaveURL('/conta/perfil')
})

test('sessão expirada no meio da navegação guarda o lugar e retoma depois do login', async ({ page }) => {
  await page.goto('/entrar')
  await fillLogin(page, ana.email, ana.password)
  await expect(page).toHaveURL('/')
  await page.goto('/?network=polygon')
  await waitForMocks(page)
  await page.waitForLoadState('networkidle')
  await setScenario(page, 'session-expired')
  await page
    .getByRole('link', { name: 'Meu perfil' })
    .filter({ visible: true })
    .first()
    .click({ timeout: 5_000 })
    .catch(() => undefined)
  await expect(page).toHaveURL(/\/entrar\?.*motivo=expirada/)
  await expect(page.getByRole('alert').filter({ hasText: 'Sua sessão expirou' })).toBeVisible()
  await setScenario(page, 'default')
  await fillLogin(page, ana.email, ana.password)
  await expect(page).toHaveURL('/conta/perfil')
})

test('logout e troca de usuário não deixam vazar dados da sessão anterior', async ({ page }) => {
  test.skip(!isDesktop(page), 'o menu da conta fica no header do desktop; o mobile sai pela conta')
  await page.goto('/entrar')
  await fillLogin(page, ana.email, ana.password)
  await expect(page).toHaveURL('/')
  const sage = cards(page).filter({ hasText: 'Sage Nomad #009' })
  await expect(sage.getByRole('button', { name: 'Remover Sage Nomad #009 dos favoritos' })).toBeVisible()

  await logout(page, ana.name)
  await expect(sage.getByRole('button', { name: 'Favoritar Sage Nomad #009' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )

  await page.goto('/entrar')
  await fillLogin(page, bruno.email, bruno.password)
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: `Conta de ${bruno.name}` })).toBeVisible()
  await expect(sage.getByRole('button', { name: 'Favoritar Sage Nomad #009' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
