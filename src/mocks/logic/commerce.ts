import type { NetworkId } from '@/shared/contracts/common'
import type { CartAdjustment, CartItem, Coupon, QuoteIssue, QuoteLine } from '@/shared/contracts/commerce'
import { multiplyWei, parseEth, percentOf, sumWei, toEthString } from '@/shared/domain/eth'
import type { CartItemRecord, CouponRecord, NftRecord } from '../db/schema'

export const NETWORK_FEES: Record<NetworkId, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.001',
}

export interface EditionLimit {
  max: number
  soldOut: boolean
}

export function editionLimit(nft: NftRecord | undefined, editionId: string): EditionLimit | null {
  const edition = nft?.editions.find((candidate) => candidate.id === editionId)
  if (!edition) return null
  if (edition.status === 'sold_out' || edition.available === 0) return { max: 0, soldOut: true }
  const stock = edition.available ?? Number.POSITIVE_INFINITY
  return { max: Math.min(edition.maxPerOrder, stock), soldOut: false }
}

export function priceCartItem(item: CartItemRecord, nft: NftRecord): CartItem | null {
  const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
  if (!edition) return null
  const limit = editionLimit(nft, item.editionId)
  const maxQuantity = limit?.max ?? 0
  const status: CartItem['status'] =
    maxQuantity === 0 ? 'sold_out' : item.quantity > maxQuantity ? 'limited' : 'available'
  return {
    id: item.id,
    nftId: nft.id,
    editionId: edition.id,
    quantity: item.quantity,
    name: nft.name,
    tokenId: nft.tokenId,
    image: nft.image,
    editionLabel: edition.label,
    unitPrice: edition.price,
    lineTotal: toEthString(multiplyWei(parseEth(edition.price), item.quantity)),
    maxQuantity,
    status,
  }
}

export function priceCart(items: readonly CartItemRecord[], nfts: readonly NftRecord[]): CartItem[] {
  const byId = new Map(nfts.map((nft) => [nft.id, nft]))
  return [...items]
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id))
    .flatMap((item) => {
      const nft = byId.get(item.nftId)
      const priced = nft ? priceCartItem(item, nft) : null
      return priced ? [priced] : []
    })
}

export function cartSubtotal(items: readonly CartItem[]): string {
  return toEthString(
    sumWei(items.filter((item) => item.status !== 'sold_out').map((item) => parseEth(item.lineTotal))),
  )
}

export function couponState(coupon: CouponRecord | undefined, now: Date): 'valid' | 'expired' | 'missing' {
  if (!coupon) return 'missing'
  return Date.parse(coupon.expiresAt) <= now.getTime() ? 'expired' : 'valid'
}

export function toCoupon(coupon: CouponRecord): Coupon {
  return { code: coupon.code, percentBps: coupon.percentBps, description: coupon.description }
}

export interface QuoteTotals {
  lines: QuoteLine[]
  coupon: Coupon | null
  subtotal: string
  discount: string
  networkFee: string
  total: string
  issues: QuoteIssue[]
}

export function computeQuote(input: {
  items: readonly CartItem[]
  coupon: CouponRecord | undefined
  network: NetworkId
  now: Date
}): QuoteTotals {
  const issues: QuoteIssue[] = []
  for (const item of input.items) {
    if (item.status === 'sold_out') {
      issues.push({
        code: 'out_of_stock',
        cartItemId: item.id,
        message: `${item.name} (${item.editionLabel}) esgotou.`,
      })
    } else if (item.status === 'limited') {
      issues.push({
        code: 'quantity_limit',
        cartItemId: item.id,
        message: `${item.name} (${item.editionLabel}) aceita no máximo ${item.maxQuantity} por pedido.`,
      })
    }
  }
  const state = couponState(input.coupon, input.now)
  if (state === 'expired' && input.coupon) {
    issues.push({
      code: 'coupon_expired',
      cartItemId: null,
      message: `O cupom ${input.coupon.code} expirou.`,
    })
  }
  const purchasable = input.items.filter((item) => item.status !== 'sold_out')
  const lines: QuoteLine[] = purchasable.map((item) => ({
    cartItemId: item.id,
    nftId: item.nftId,
    editionId: item.editionId,
    name: item.name,
    tokenId: item.tokenId,
    image: item.image,
    editionLabel: item.editionLabel,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }))
  const subtotal = sumWei(lines.map((line) => parseEth(line.lineTotal)))
  const coupon = state === 'valid' && input.coupon ? toCoupon(input.coupon) : null
  const discount = coupon ? percentOf(subtotal, coupon.percentBps) : 0n
  const fee = lines.length > 0 ? parseEth(NETWORK_FEES[input.network]) : 0n
  return {
    lines,
    coupon,
    subtotal: toEthString(subtotal),
    discount: toEthString(discount),
    networkFee: toEthString(fee),
    total: toEthString(subtotal - discount + fee),
    issues,
  }
}

export function quoteSignature(
  quote: Pick<QuoteTotals, 'lines' | 'coupon' | 'networkFee' | 'total'>,
): string {
  return JSON.stringify({
    lines: quote.lines.map((line) => [line.editionId, line.unitPrice, line.quantity]),
    coupon: quote.coupon?.code ?? null,
    networkFee: quote.networkFee,
    total: quote.total,
  })
}

export function mergeCartItems(input: {
  guest: readonly CartItemRecord[]
  user: readonly CartItemRecord[]
  nfts: readonly NftRecord[]
}): { quantities: Map<string, { nftId: string; quantity: number }>; adjustments: CartAdjustment[] } {
  const byId = new Map(input.nfts.map((nft) => [nft.id, nft]))
  const quantities = new Map<string, { nftId: string; quantity: number }>()
  for (const item of input.user) {
    quantities.set(item.editionId, { nftId: item.nftId, quantity: item.quantity })
  }
  const adjustments: CartAdjustment[] = []
  for (const item of input.guest) {
    const nft = byId.get(item.nftId)
    const limit = editionLimit(nft, item.editionId)
    const current = quantities.get(item.editionId)?.quantity ?? 0
    const requested = current + item.quantity
    if (!nft || !limit) continue
    if (limit.soldOut) {
      adjustments.push({
        nftId: item.nftId,
        editionId: item.editionId,
        name: nft.name,
        requested,
        applied: current,
        reason: 'out_of_stock',
      })
      continue
    }
    const applied = Math.min(requested, limit.max)
    if (applied < requested) {
      adjustments.push({
        nftId: item.nftId,
        editionId: item.editionId,
        name: nft.name,
        requested,
        applied,
        reason: 'quantity_limit',
      })
    }
    quantities.set(item.editionId, { nftId: item.nftId, quantity: applied })
  }
  return { quantities, adjustments }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, inner]) => [key, sortKeys(inner)]),
    )
  }
  return value
}

export function requestFingerprint(body: unknown): string {
  return JSON.stringify(sortKeys(body))
}

export type IdempotencyDecision = 'create' | 'replay' | 'conflict'

export function idempotencyDecision(
  existing: { requestHash: string } | undefined,
  fingerprint: string,
): IdempotencyDecision {
  if (!existing) return 'create'
  return existing.requestHash === fingerprint ? 'replay' : 'conflict'
}

export function transactionReference(orderId: string): string {
  let hash = 0x811c9dc5
  let hex = ''
  for (let round = 0; hex.length < 64; round += 1) {
    for (const char of `${orderId}:${round}`) {
      hash ^= char.charCodeAt(0)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    hex += hash.toString(16).padStart(8, '0')
  }
  return `0x${hex.slice(0, 64)}`
}
