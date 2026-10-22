import { expect, type Page, test } from '@playwright/test'

async function control<T>(page: Page, path: string, body?: unknown): Promise<T> {
  return page.evaluate(
    async ({ path, body }) => {
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return (await response.json()) as T
    },
    { path, body },
  )
}

async function waitForMocks(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch('/__mock/realtime')
        return response.headers.get('content-type')?.includes('application/json') ?? false
      }),
    )
    .toBe(true)
}

async function waitForSocket(page: Page) {
  await expect
    .poll(async () => (await control<{ connections: number }>(page, '/__mock/realtime')).connections)
    .toBeGreaterThan(0)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForMocks(page)
  await control(page, '/__mock/reset', {})
  await page.reload()
  await waitForMocks(page)
  await waitForSocket(page)
})

test('evento disparado no endpoint de controle chega pelo socket.io-client', async ({ page }) => {
  const result = await control<{ delivered: number }>(page, '/__mock/events/nft-updated', {
    nftId: 'nft-0042',
    price: '1.29',
  })
  expect(result.delivered).toBe(1)
  await expect(page.getByRole('status')).toHaveText(
    'O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.',
  )
})

test('a mudança fica no banco simulado e sai também pelo REST depois do refresh', async ({ page }) => {
  await control(page, '/__mock/events/nft-updated', { nftId: 'nft-0042', price: '1.29' })
  await page.reload()
  await waitForMocks(page)
  const nft = await control<{ price: string; version: number }>(page, '/api/nfts/nft-0042')
  expect(nft.price).toBe('1.29')
  expect(nft.version).toBe(2)
})

test('o cliente reconecta depois de uma queda da conexão', async ({ page }) => {
  const { closed } = await control<{ closed: number }>(page, '/__mock/realtime/disconnect', {})
  expect(closed).toBe(1)
  await waitForSocket(page)
  const result = await control<{ delivered: number }>(page, '/__mock/events/nft-updated', {
    nftId: 'nft-0042',
    available: 0,
  })
  expect(result.delivered).toBe(1)
  await expect(page.getByRole('status')).toHaveText('Emerald Ape #042 esgotou.')
})
