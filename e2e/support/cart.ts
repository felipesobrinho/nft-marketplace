import type { Page } from '@playwright/test'
import { call } from './mock'

export interface CartSeedItem {
  nftId: string
  editionId: string
  quantity: number
}

export async function guestCartId(page: Page): Promise<string> {
  return page.evaluate(() => {
    const stored = localStorage.getItem('kurio:cart-id')
    if (stored) return JSON.parse(stored) as string
    const created = crypto.randomUUID()
    localStorage.setItem('kurio:cart-id', JSON.stringify(created))
    return created
  })
}

export async function seedGuestCart(page: Page, items: CartSeedItem[]): Promise<void> {
  const cartId = await guestCartId(page)
  for (const item of items) {
    const result = await call(page, '/api/cart/items', { body: item, headers: { 'x-cart-id': cartId } })
    if (result.status !== 200) throw new Error(`não foi possível adicionar ${item.nftId}: ${result.status}`)
  }
}

export async function guestQuoteTotal(page: Page): Promise<string> {
  const cartId = await guestCartId(page)
  const quote = await call<{ total: string }>(page, '/api/quotes', {
    body: { network: 'ethereum' },
    headers: { 'x-cart-id': cartId },
  })
  return quote.body.total
}
