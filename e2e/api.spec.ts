import { expect, test } from '@playwright/test'
import { auth, call, login, resetMocks, setScenario } from './support/mock'

interface Page<T> {
  items: T[]
  page: number
  total: number
  totalPages: number
}
interface Nft {
  id: string
  name: string
  price: string
  network: string
}
interface Cart {
  id: string
  itemCount: number
  subtotal: string
  items: { id: string; quantity: number; editionId: string }[]
  coupon: { code: string } | null
}
interface ApiError {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
    details?: { quote?: { id: string } }
  }
}

const guestCart = '7d2b8c1e-4f3a-4b6d-9e0f-1a2b3c4d5e6f'

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'contratos da API não dependem da largura da tela')
  await resetMocks(page)
})

test('catálogo: listagem, filtros, ordenação, paginação, facetas e detalhe', async ({ page }) => {
  const list = await call<Page<Nft> & { priceRange: { min: string; max: string } }>(page, '/api/nfts')
  expect(list.status).toBe(200)
  expect(list.body.items).toHaveLength(9)
  expect(list.body.total).toBe(54)
  expect(list.body.totalPages).toBe(6)
  expect(list.body.priceRange).toEqual({ min: '0.02', max: '12.3' })

  const filtered = await call<Page<Nft>>(page, '/api/nfts?q=golden&network=solana&sort=price_asc')
  expect(filtered.body.items.length).toBeGreaterThan(0)
  for (const nft of filtered.body.items) {
    expect(nft.name.toLowerCase()).toContain('golden')
    expect(nft.network).toBe('solana')
  }
  const prices = filtered.body.items.map((nft) => Number(nft.price))
  expect(prices).toEqual([...prices].sort((a, b) => a - b))

  expect((await call<Page<Nft>>(page, '/api/nfts?page=7')).body.items).toEqual([])
  expect((await call<ApiError>(page, '/api/nfts?minPrice=2&maxPrice=1')).status).toBe(400)

  const collections = await call<{ items: { name: string }[] }>(page, '/api/collections')
  const names = collections.body.items.map((item) => item.name)
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')))

  const featured = await call<{ hero: Nft[]; spotlight: Nft }>(page, '/api/nfts/featured')
  expect(featured.body.hero).toHaveLength(3)
  expect(featured.body.spotlight.name).toBe('Sage Nomad #009')

  const detail = await call<Nft & { editions: unknown[] }>(page, '/api/nfts/nft-0042')
  expect(detail.body.name).toBe('Emerald Ape #042')
  expect(detail.body.editions).toHaveLength(4)
  expect((await call<ApiError>(page, '/api/nfts/nft-9999')).body.error.code).toBe('not_found')
})

test('sessão: cadastro, conflito, login, consulta e logout', async ({ page }) => {
  const register = await call<{ token: string }>(page, '/api/auth/register', {
    body: { username: 'carla.dias', email: 'carla@jungle.test', password: 'Senha@123' },
  })
  expect(register.status).toBe(201)
  const conflict = await call<ApiError>(page, '/api/auth/register', {
    body: { username: 'outra.pessoa', email: 'ana@jungle.test', password: 'Senha@123' },
  })
  expect(conflict.status).toBe(409)
  expect(conflict.body.error.fields?.email).toBeTruthy()

  const wrong = await call<ApiError>(page, '/api/auth/login', {
    body: { email: 'ana@jungle.test', password: 'errada' },
  })
  expect(wrong.status).toBe(401)
  expect(wrong.body.error.code).toBe('invalid_credentials')

  const token = await login(page)
  const session = await call<{ user: { email: string } }>(page, '/api/auth/session', { headers: auth(token) })
  expect(session.body.user.email).toBe('ana@jungle.test')
  expect((await call(page, '/api/auth/logout', { method: 'POST', headers: auth(token) })).status).toBe(204)
  const after = await call<ApiError>(page, '/api/auth/session', { headers: auth(token) })
  expect(after.status).toBe(401)
})

test('favoritos persistem por usuário e falham no cenário de falha', async ({ page }) => {
  const token = await login(page)
  const before = await call<{ items: Nft[] }>(page, '/api/favorites', { headers: auth(token) })
  expect(before.body.items).toHaveLength(3)
  const added = await call<{ favorited: boolean }>(page, '/api/favorites/nft-0042', {
    method: 'PUT',
    headers: auth(token),
  })
  expect(added.body.favorited).toBe(true)
  expect(
    (await call<{ items: Nft[] }>(page, '/api/favorites', { headers: auth(token) })).body.items,
  ).toHaveLength(4)

  const bruno = await login(page, 'bruno@jungle.test')
  expect(
    (await call<{ items: Nft[] }>(page, '/api/favorites', { headers: auth(bruno) })).body.items,
  ).toHaveLength(0)

  await setScenario(page, 'favorite-failure')
  const failed = await call<ApiError>(page, '/api/favorites/nft-0042', {
    method: 'DELETE',
    headers: auth(token),
  })
  expect(failed.status).toBe(503)
})

test('carrinho do visitante: limites, cupom, cotação e merge no login', async ({ page }) => {
  const headers = { 'x-cart-id': guestCart }
  const added = await call<Cart>(page, '/api/cart/items', {
    headers,
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 2 },
  })
  expect(added.status).toBe(200)
  expect(added.body.itemCount).toBe(2)
  expect(added.body.subtotal).toBe('2.38')

  const item = added.body.items[0]!
  const tooMany = await call<ApiError>(page, `/api/cart/items/${item.id}`, {
    method: 'PATCH',
    headers,
    body: { quantity: 6 },
  })
  expect(tooMany.status).toBe(409)
  expect(tooMany.body.error.code).toBe('quantity_limit')

  const soldOut = await call<ApiError>(page, '/api/cart/items', {
    headers,
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-1', quantity: 1 },
  })
  expect(soldOut.body.error.code).toBe('out_of_stock')

  const expired = await call<ApiError>(page, '/api/cart/coupon', {
    method: 'PUT',
    headers,
    body: { code: 'VELHO20' },
  })
  expect(expired.body.error.code).toBe('coupon_expired')
  const invalid = await call<ApiError>(page, '/api/cart/coupon', {
    method: 'PUT',
    headers,
    body: { code: 'NADA' },
  })
  expect(invalid.body.error.code).toBe('coupon_invalid')
  const coupon = await call<Cart>(page, '/api/cart/coupon', {
    method: 'PUT',
    headers,
    body: { code: 'jungle10' },
  })
  expect(coupon.body.coupon?.code).toBe('JUNGLE10')

  const quote = await call<{ subtotal: string; discount: string; networkFee: string; total: string }>(
    page,
    '/api/quotes',
    { headers, body: { network: 'ethereum' } },
  )
  expect(quote.body).toMatchObject({
    subtotal: '2.38',
    discount: '0.238',
    networkFee: '0.016',
    total: '2.158',
  })

  const token = await login(page)
  const merged = await call<{ cart: Cart; adjustments: unknown[] }>(page, '/api/cart/merge', {
    headers: auth(token),
    body: { guestCartId: guestCart },
  })
  expect(merged.body.cart.itemCount).toBe(2)
  expect(merged.body.cart.coupon?.code).toBe('JUNGLE10')
  expect(merged.body.adjustments).toEqual([])
  const guestAfter = await call<Cart>(page, '/api/cart', { headers })
  expect(guestAfter.body.itemCount).toBe(0)
})

test('pedido: idempotência, liquidação e remoção só do que foi comprado', async ({ page }) => {
  const token = await login(page)
  const headers = auth(token)
  await call(page, '/api/cart/items', {
    headers,
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 3 },
  })
  const quote = await call<{ id: string; total: string }>(page, '/api/quotes', {
    headers,
    body: { network: 'ethereum' },
  })
  const order = {
    quoteId: quote.body.id,
    walletId: 'wallet-ana-primary',
    network: 'ethereum',
    provider: 'metamask',
    buyer: {
      displayName: 'Ana Lima',
      username: 'ana.lima',
      email: 'ana@jungle.test',
      referralCode: '',
      note: '',
    },
  }

  expect((await call<ApiError>(page, '/api/orders', { headers, body: order })).status).toBe(400)
  const key = { ...headers, 'idempotency-key': 'chave-0001-teste' }
  const first = await call<{ id: string; status: string }>(page, '/api/orders', { headers: key, body: order })
  expect(first.status).toBe(201)
  expect(first.body.status).toBe('pending')
  const replay = await call<{ id: string }>(page, '/api/orders', { headers: key, body: order })
  expect(replay.status).toBe(200)
  expect(replay.body.id).toBe(first.body.id)
  const conflict = await call<ApiError>(page, '/api/orders', {
    headers: key,
    body: { ...order, provider: 'coinbase' },
  })
  expect(conflict.body.error.code).toBe('idempotency_conflict')

  const pending = await call<{ items: unknown[] }>(page, '/api/orders?status=pending', { headers })
  expect(pending.body.items).toHaveLength(1)
  await call(page, '/__mock/orders/settle-pending', { body: {} })
  const settled = await call<{ status: string; transactionRef: string; receipt: { total: string } }>(
    page,
    `/api/orders/${first.body.id}`,
    { headers },
  )
  expect(settled.body.status).toBe('confirmed')
  expect(settled.body.transactionRef).toMatch(/^0x[0-9a-f]{64}$/)
  expect(settled.body.receipt.total).toBe(quote.body.total)
  expect((await call<Cart>(page, '/api/cart', { headers })).body.itemCount).toBe(0)

  const bruno = await login(page, 'bruno@jungle.test')
  expect((await call<ApiError>(page, `/api/orders/${first.body.id}`, { headers: auth(bruno) })).status).toBe(
    404,
  )
})

test('checkout: preço muda e pagamento é recusado sem perder o carrinho', async ({ page }) => {
  const token = await login(page)
  const headers = auth(token)
  await call(page, '/api/cart/items', {
    headers,
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', quantity: 1 },
  })
  const quote = await call<{ id: string }>(page, '/api/quotes', { headers, body: { network: 'ethereum' } })
  const order = {
    quoteId: quote.body.id,
    walletId: 'wallet-ana-primary',
    network: 'ethereum',
    provider: 'metamask',
    buyer: {
      displayName: 'Ana Lima',
      username: 'ana.lima',
      email: 'ana@jungle.test',
      referralCode: '',
      note: '',
    },
  }

  await setScenario(page, 'price-change-at-checkout')
  const changed = await call<ApiError>(page, '/api/orders', {
    headers: { ...headers, 'idempotency-key': 'chave-preco-0001' },
    body: order,
  })
  expect(changed.status).toBe(409)
  expect(changed.body.error.code).toBe('quote_outdated')
  const freshQuoteId = changed.body.error.details?.quote?.id
  expect(freshQuoteId).toBeTruthy()

  await setScenario(page, 'payment-refused')
  const created = await call<{ id: string }>(page, '/api/orders', {
    headers: { ...headers, 'idempotency-key': 'chave-recusa-0001' },
    body: { ...order, quoteId: freshQuoteId },
  })
  expect(created.status).toBe(201)
  await call(page, '/__mock/orders/settle-pending', { body: {} })
  const refused = await call<{ status: string; reason: string }>(page, `/api/orders/${created.body.id}`, {
    headers,
  })
  expect(refused.body.status).toBe('refused')
  expect(refused.body.reason).toBeTruthy()
  expect((await call<Cart>(page, '/api/cart', { headers })).body.itemCount).toBe(1)
})

test('perfil e carteiras: conflito, permissão e conexão recusada', async ({ page }) => {
  const token = await login(page)
  const headers = auth(token)
  const profile = await call<{ username: string }>(page, '/api/profile', { headers })
  expect(profile.body.username).toBe('ana.lima')
  const taken = await call<ApiError>(page, '/api/profile', {
    method: 'PATCH',
    headers,
    body: { displayName: 'Ana', username: 'bruno.costa', email: 'ana@jungle.test', ensName: null },
  })
  expect(taken.status).toBe(409)
  expect(taken.body.error.fields?.username).toBeTruthy()

  const wallets = await call<{ items: { role: string }[] }>(page, '/api/wallets', { headers })
  expect(wallets.body.items.map((wallet) => wallet.role)).toEqual(['primary', 'secondary'])
  const connected = await call<{ status: string }>(page, '/api/wallets/wallet-ana-primary/connection', {
    headers,
    body: { provider: 'metamask' },
  })
  expect(connected.body.status).toBe('connected')

  await setScenario(page, 'wallet-refused')
  const refused = await call<ApiError>(page, '/api/wallets/wallet-ana-primary/connection', {
    headers,
    body: { provider: 'metamask' },
  })
  expect(refused.body.error.code).toBe('wallet_refused')

  await setScenario(page, 'forbidden')
  expect((await call<ApiError>(page, '/api/profile', { headers })).status).toBe(403)
  await setScenario(page, 'session-expired')
  expect((await call<ApiError>(page, '/api/profile', { headers })).body.error.code).toBe('session_expired')
})

test('rede: sem conexão e erro 503 são reproduzíveis', async ({ page }) => {
  await setScenario(page, 'server-error')
  expect((await call<ApiError>(page, '/api/nfts')).status).toBe(503)
  await setScenario(page, 'empty-catalog')
  expect((await call<Page<Nft>>(page, '/api/nfts')).body.total).toBe(0)
  await setScenario(page, 'offline')
  const offline = await page.evaluate(async () => {
    try {
      await fetch('/api/nfts')
      return 'respondeu'
    } catch {
      return 'falhou'
    }
  })
  expect(offline).toBe('falhou')
})
