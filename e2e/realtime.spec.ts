import { expect, test } from '@playwright/test'
import { call, resetMocks, waitForMocks, waitForSocket } from './support/mock'

test.beforeEach(async ({ page }) => {
  await resetMocks(page)
  await waitForSocket(page)
})

test('evento disparado no endpoint de controle chega pelo socket.io-client', async ({ page }) => {
  const result = await call<{ delivered: number }>(page, '/__mock/events/nft-updated', {
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', price: '1.29' },
  })
  expect(result.body.delivered).toBe(1)
  await expect(page.getByRole('status')).toHaveText(
    'O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.',
  )
})

test('a mudança fica no banco simulado e sai também pelo REST depois do refresh', async ({ page }) => {
  await call(page, '/__mock/events/nft-updated', {
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', price: '1.29' },
  })
  await page.reload()
  await waitForMocks(page)
  const nft = await call<{ price: string; version: number }>(page, '/api/nfts/nft-0042')
  expect(nft.body.price).toBe('1.29')
  expect(nft.body.version).toBe(2)
})

test('o cliente reconecta depois de uma queda da conexão', async ({ page }) => {
  const { body } = await call<{ closed: number }>(page, '/__mock/realtime/disconnect', { body: {} })
  expect(body.closed).toBe(1)
  await waitForSocket(page)
  const result = await call<{ delivered: number }>(page, '/__mock/events/nft-updated', {
    body: { nftId: 'nft-0761', available: 0 },
  })
  expect(result.body.delivered).toBe(1)
  await expect(page.getByRole('status')).toHaveText('Emerald Oracle #761 esgotou.')
})

test('evento duplicado ou antigo não é reaplicado', async ({ page }) => {
  await call(page, '/__mock/events/nft-updated', {
    body: { nftId: 'nft-0042', editionId: 'nft-0042-1-50', price: '1.29' },
  })
  const status = page.getByRole('status')
  await expect(status).toHaveText('O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.')
  await page.evaluate(() => {
    const region = document.querySelector('[role="status"]')
    if (region) region.textContent = ''
  })
  const duplicate = await call<{ delivered: number }>(page, '/__mock/events/replay', {
    body: { mode: 'duplicate' },
  })
  const stale = await call<{ delivered: number }>(page, '/__mock/events/replay', { body: { mode: 'stale' } })
  expect(duplicate.body.delivered).toBe(1)
  expect(stale.body.delivered).toBe(1)
  await page.waitForTimeout(300)
  await expect(status).toHaveText('')
})
