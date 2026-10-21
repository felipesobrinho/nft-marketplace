import type { QueryClient } from '@tanstack/react-query'
import type { CartAdjustment } from '@/shared/contracts/commerce'
import { mergeCart } from '../infrastructure/cartApi'
import { getCartId, resetCartId } from '../infrastructure/cartId'
import { cartKeys } from './queries'

export async function mergeGuestCart(queryClient: QueryClient, userId: string): Promise<CartAdjustment[]> {
  const guestCartId = getCartId()
  const result = await mergeCart(guestCartId)
  queryClient.setQueryData(cartKeys.cart({ userId }), result.cart)
  queryClient.removeQueries({ queryKey: cartKeys.owner({ cartId: guestCartId }) })
  resetCartId()
  return result.adjustments
}

export function describeAdjustment(adjustment: CartAdjustment): string {
  if (adjustment.reason === 'out_of_stock') return `${adjustment.name} esgotou e saiu do carrinho.`
  return `${adjustment.name} ficou com ${adjustment.applied} unidade(s), o limite da edição.`
}
