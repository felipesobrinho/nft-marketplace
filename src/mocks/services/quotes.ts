import type { NetworkId } from '@/shared/contracts/common'
import type { Quote } from '@/shared/contracts/commerce'
import { getDb } from '../db'
import type { QuoteRecord } from '../db/schema'
import { computeQuote, priceCart } from '../logic/commerce'

export const QUOTE_TTL_MS = 10 * 60 * 1000
const KEEP_QUOTES_PER_CART = 5

export function toQuote(record: QuoteRecord): Quote {
  return {
    id: record.id,
    version: record.version,
    cartVersion: record.cartVersion,
    network: record.network,
    lines: record.lines,
    coupon: record.coupon,
    subtotal: record.subtotal,
    discount: record.discount,
    networkFee: record.networkFee,
    total: record.total,
    issues: record.issues,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  }
}

export async function createQuote(cartId: string, network: NetworkId): Promise<QuoteRecord> {
  const db = getDb()
  const cart = db.carts.findFirst((q) => q.where({ id: cartId }))
  if (!cart) throw new Error(`Carrinho ${cartId} não existe`)
  const nfts = db.nfts.all()
  const items = priceCart(
    db.cartItems.findMany((q) => q.where({ cartId })),
    nfts,
  )
  const coupon = cart.couponCode
    ? db.coupons.findFirst((q) => q.where({ code: cart.couponCode ?? '' }))
    : undefined
  const now = new Date()
  const totals = computeQuote({ items, coupon, network, now })
  const versions = new Map(nfts.map((nft) => [nft.id, nft.version]))
  const priceVersion = totals.lines.reduce((sum, line) => sum + (versions.get(line.nftId) ?? 0), 0)
  const record = await db.quotes.create({
    id: `quote-${crypto.randomUUID()}`,
    version: cart.version + priceVersion,
    cartVersion: cart.version,
    network,
    ...totals,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
    cartId,
    userId: cart.userId,
  })
  const stale = db.quotes
    .findMany((q) => q.where({ cartId }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(KEEP_QUOTES_PER_CART)
  for (const quote of stale) db.quotes.delete((q) => q.where({ id: quote.id }))
  return record
}
