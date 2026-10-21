import { getDb, onDbReset } from '../db'
import type { OrderRecord } from '../db/schema'
import { transactionReference } from '../logic/commerce'
import { orderUpdatedEvent } from '../realtime/events'
import { publish } from '../realtime/hub'
import { touchCart } from '../handlers/cart'
import { consumeStock } from './nfts'

export const SETTLEMENT_DELAY_MS = 3_000
export const REFUSAL_REASON = 'Pagamento recusado pela carteira: saldo insuficiente.'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

onDbReset(() => {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})

async function removePurchasedItems(order: OrderRecord): Promise<void> {
  const db = getDb()
  for (const line of order.receipt.lines) {
    const item = db.cartItems.findFirst((q) => q.where({ cartId: order.cartId, editionId: line.editionId }))
    if (!item) continue
    const remaining = item.quantity - line.quantity
    if (remaining > 0) {
      await db.cartItems.update((q) => q.where({ id: item.id }), {
        data(record) {
          record.quantity = remaining
        },
      })
    } else {
      db.cartItems.delete((q) => q.where({ id: item.id }))
    }
  }
  if (db.carts.findFirst((q) => q.where({ id: order.cartId }))) await touchCart(order.cartId)
}

export async function settleOrder(
  orderId: string,
  forced?: { status: 'confirmed' | 'refused'; reason?: string },
): Promise<OrderRecord | null> {
  const db = getDb()
  const order = db.orders.findFirst((q) => q.where({ id: orderId }))
  if (!order || order.status !== 'pending') return order ?? null
  timers.delete(orderId)
  const status = forced?.status ?? order.outcome
  const updated = await db.orders.update((q) => q.where({ id: orderId }), {
    data(record) {
      record.status = status
      record.reason = status === 'refused' ? (forced?.reason ?? REFUSAL_REASON) : null
      record.transactionRef = status === 'confirmed' ? transactionReference(record.id) : null
      record.updatedAt = new Date().toISOString()
      record.version += 1
    },
  })
  if (!updated) return null
  if (status === 'confirmed') {
    for (const line of updated.receipt.lines) await consumeStock(line.nftId, line.editionId, line.quantity)
    await removePurchasedItems(updated)
  }
  publish(orderUpdatedEvent(updated))
  return updated
}

export function scheduleSettlement(order: OrderRecord): void {
  if (order.status !== 'pending' || timers.has(order.id)) return
  const wait = Math.max(0, Date.parse(order.settlesAt) - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      void settleOrder(order.id)
    }, wait),
  )
}

export function resumePendingSettlements(): void {
  for (const order of getDb().orders.findMany((q) => q.where({ status: 'pending' })))
    scheduleSettlement(order)
}
