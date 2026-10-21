import { expect, test } from '@playwright/test'
import {
  addToUserCart,
  confirmButton,
  connectWallet,
  fillBuyer,
  reachReview,
  userCartCount,
  userOrders,
} from './support/checkout'
import { resetMocks, setScenario, waitForMocks } from './support/mock'
import { ana, bruno, signInThroughApi } from './support/session'

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await signInThroughApi(page)
  await addToUserCart(page, [{ nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 }])
})

test('pagamento recusado mostra o motivo e mantém os itens no carrinho', async ({ page }) => {
  await reachReview(page)
  await setScenario(page, 'payment-refused')
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/saldo insuficiente/)).toBeVisible()
  await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()
  expect(await userCartCount(page)).toBe(2)

  await setScenario(page, 'default')
  await page.getByRole('link', { name: 'Voltar ao pagamento' }).click()
  await expect(page).toHaveURL('/pagamento')
  await expect(page.getByRole('heading', { name: 'Revisão' })).toBeVisible()
})

test('clique repetido em confirmar cria um pedido só', async ({ page }) => {
  await reachReview(page)
  await confirmButton(page).evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
    button.click()
  })
  await expect(page).toHaveURL(/\/pedidos\/ord-/)
  expect(await userOrders(page)).toHaveLength(1)
})

test('timeout depois de criar o pedido repete com a mesma chave e devolve o mesmo pedido', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await reachReview(page)
  await setScenario(page, 'order-timeout')
  await confirmButton(page).click()
  await expect(page.getByRole('button', { name: 'Enviando pedido…' })).toBeDisabled()
  await expect(page).toHaveURL(/\/pedidos\/ord-/, { timeout: 30_000 })
  const orders = await userOrders(page)
  expect(orders).toHaveLength(1)
  expect(page.url()).toContain(orders[0]?.id ?? 'sem-pedido')
})

test('preço muda na confirmação: mostra a diferença e pede nova confirmação', async ({ page }) => {
  await reachReview(page)
  await setScenario(page, 'price-change-at-checkout')
  await confirmButton(page).click()
  const alert = page.getByRole('alert').filter({ hasText: 'preço de 1.19 ETH para 1.309 ETH' })
  await expect(alert).toBeVisible()
  expect(await userOrders(page)).toHaveLength(0)

  await page.getByRole('button', { name: 'Confirmar com os novos valores' }).click()
  await expect(page).toHaveURL(/\/pedidos\/ord-/)
  expect(await userOrders(page)).toHaveLength(1)
})

test('edição esgota na confirmação: bloqueia a compra e leva ao carrinho', async ({ page }) => {
  await reachReview(page)
  await setScenario(page, 'sold-out-at-checkout')
  await confirmButton(page).click()
  await expect(page.getByRole('link', { name: 'Ajustar carrinho' })).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
  expect(await userOrders(page)).toHaveLength(0)
  await page.getByRole('link', { name: 'Ajustar carrinho' }).click()
  await expect(page).toHaveURL('/carrinho')
})

test('carteira recusa a conexão e conecta na nova tentativa', async ({ page }) => {
  await page.goto('/pagamento')
  await fillBuyer(page)
  await setScenario(page, 'wallet-refused')
  await page.getByRole('radio', { name: /Reserva/ }).check()
  await page.getByRole('radio', { name: /Coinbase/ }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'recusou a conexão' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continuar para a revisão' })).toBeDisabled()

  await setScenario(page, 'default')
  await page
    .getByRole('button', { name: /Conectar carteira|Tentar de novo/ })
    .first()
    .click()
  await expect(page.getByText(/Conectada com/)).toBeVisible()
  await page.getByRole('button', { name: 'Continuar para a revisão' }).click()
  await expect(page.getByText(/Polygon/).first()).toBeVisible()
})

test('sessão expira no checkout e retoma na revisão depois do login', async ({ page }) => {
  await reachReview(page)
  await setScenario(page, 'session-expired')
  await confirmButton(page).click()
  await expect(page).toHaveURL(
    /\/entrar\?.*redirect=%2Fpagamento.*motivo=expirada|\/entrar\?.*motivo=expirada.*redirect=%2Fpagamento/,
  )
  await setScenario(page, 'default')

  const form = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Entrar' }) })
    .filter({ visible: true })
    .first()
  await form.getByLabel('E-mail').fill(ana.email)
  await form.getByLabel(/^Senha/).fill(ana.password)
  await form.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/pagamento')
  await waitForMocks(page)
  await expect(page.getByRole('heading', { name: 'Revisão' })).toBeVisible()
  await expect(page.getByText('ana.lima').first()).toBeVisible()
  await expect(confirmButton(page)).toBeEnabled()
  expect(await userOrders(page)).toHaveLength(0)
})

test('logout apaga o rascunho do checkout e o próximo usuário começa do zero', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 768, 'o menu da conta fica no header do desktop')
  await page.goto('/pagamento')
  await fillBuyer(page)
  await connectWallet(page)
  const draftKeys = () =>
    page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('kurio:checkout:')))
  expect(await draftKeys()).toHaveLength(1)

  await page.getByRole('button', { name: `Conta de ${ana.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
  expect(await draftKeys()).toHaveLength(0)

  await page.goto('/entrar?redirect=%2Fpagamento')
  const form = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Entrar' }) })
    .filter({ visible: true })
    .first()
  await form.getByLabel('E-mail').fill(bruno.email)
  await form.getByLabel(/^Senha/).fill(bruno.password)
  await form.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await addToUserCart(page, [{ nftId: 'nft-0088', editionId: 'nft-0088-1-50', quantity: 1 }])
  await page.reload()
  await waitForMocks(page)
  await expect(page.getByRole('heading', { name: 'Dados do colecionador' })).toBeVisible()
  await expect(page.getByLabel(/^Nome de usuário/)).not.toHaveValue('ana.lima')
  expect(await draftKeys()).toHaveLength(0)
})
