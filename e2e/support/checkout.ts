import { expect, type Locator, type Page } from '@playwright/test'
import { type ApiResult, type CallOptions, call } from './mock'

export interface OrderSnapshot {
  id: string
  status: 'pending' | 'confirmed' | 'refused'
}

async function sessionToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('kurio:session')
    return raw ? (JSON.parse(raw) as { token: string }).token : null
  })
  if (!token) throw new Error('sem sessão no navegador')
  return token
}

export async function authedCall<T = unknown>(
  page: Page,
  path: string,
  options: CallOptions = {},
): Promise<ApiResult<T>> {
  const token = await sessionToken(page)
  return call<T>(page, path, {
    ...options,
    headers: { ...options.headers, authorization: `Bearer ${token}` },
  })
}

export async function addToUserCart(
  page: Page,
  items: { nftId: string; editionId: string; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    const result = await authedCall(page, '/api/cart/items', { body: item })
    if (result.status !== 200) throw new Error(`não foi possível adicionar ${item.nftId}: ${result.status}`)
  }
}

export async function userOrders(page: Page): Promise<OrderSnapshot[]> {
  const result = await authedCall<{ items: OrderSnapshot[] }>(page, '/api/orders')
  return result.body.items
}

export async function userCartCount(page: Page): Promise<number> {
  const result = await authedCall<{ itemCount: number }>(page, '/api/cart')
  return result.body.itemCount
}

export function confirmButton(page: Page): Locator {
  return page.getByRole('button', { name: /^(Confirmar compra|Confirmar com os novos valores)$/ })
}

export async function fillBuyer(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Dados do colecionador' })).toBeVisible()
  const main = page.locator('main')
  await main.getByLabel(/^Nome de exibição/).fill('Ana Lima')
  await main.getByLabel(/^Nome de usuário/).fill('ana.lima')
  await main.getByLabel(/^E-mail/).fill('ana@jungle.test')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
}

export async function connectWallet(page: Page, wallet = /Principal/, provider = /MetaMask/): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Carteira e rede' })).toBeVisible()
  await page.getByRole('radio', { name: wallet }).check()
  await page.getByRole('radio', { name: provider }).check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/Conectada com/)).toBeVisible()
}

export async function reachReview(page: Page): Promise<void> {
  await page.goto('/pagamento')
  await fillBuyer(page)
  await connectWallet(page)
  await page.getByRole('button', { name: 'Continuar para a revisão' }).click()
  await expect(page.getByRole('heading', { name: 'Revisão' })).toBeVisible()
  await expect(confirmButton(page)).toBeEnabled()
}
