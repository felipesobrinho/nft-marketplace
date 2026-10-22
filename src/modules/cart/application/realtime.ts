import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import type { Cart } from '@/shared/contracts/commerce'
import type { NftUpdatedEvent } from '@/shared/contracts/events'
import { realtime } from '@/shared/infrastructure/realtime'
import { describeCartImpact } from '../domain/cartImpact'
import { type CartOwner, cartKeys, useCartOwner } from './queries'

function ownerFrom(key: string): CartOwner {
  const [kind, id] = key.split(':') as [string, string]
  return kind === 'user' ? { userId: id } : { cartId: id }
}

function useOwnerKey(): string {
  const owner = useCartOwner()
  return 'userId' in owner ? `user:${owner.userId}` : `guest:${owner.cartId}`
}

function cartHas(cart: Cart | undefined, event: NftUpdatedEvent): boolean {
  return cart?.items.some((item) => item.nftId === event.resource.id) ?? false
}

export function useCartRealtime(): void {
  const ownerKey = useOwnerKey()
  const queryClient = useQueryClient()

  useEffect(() => {
    const owner = ownerFrom(ownerKey)
    const offUpdate = realtime.subscribe('nft.updated', (event) => {
      if (!cartHas(queryClient.getQueryData<Cart>(cartKeys.cart(owner)), event)) return
      void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
      void queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] })
    })
    const offReconnect = realtime.onReconnect(() => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.cart(owner) })
      void queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] })
    })
    return () => {
      offUpdate()
      offReconnect()
    }
  }, [ownerKey, queryClient])
}

export function useCartChangeNotice(): { message: string | null; dismiss: () => void } {
  const ownerKey = useOwnerKey()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const owner = ownerFrom(ownerKey)
    return realtime.subscribe('nft.updated', (event) => {
      const messages = describeCartImpact(queryClient.getQueryData<Cart>(cartKeys.cart(owner)), event)
      if (messages.length === 0) return
      setMessage(`${messages.join(' ')} Os valores do carrinho foram atualizados.`)
    })
  }, [ownerKey, queryClient])

  const dismiss = useCallback(() => setMessage(null), [])
  return { message, dismiss }
}
