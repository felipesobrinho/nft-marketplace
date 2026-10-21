import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUserId } from '@/modules/auth'
import type { AddCartItemRequest, Cart } from '@/shared/contracts/commerce'
import { errorMessage } from '@/shared/domain/apiError'
import { addCartItem, fetchCart } from '../infrastructure/cartApi'
import { getCartId } from '../infrastructure/cartId'

export type CartOwner = { userId: string } | { cartId: string }

export const cartKeys = {
  owner: (owner: CartOwner) =>
    'userId' in owner ? (['user', owner.userId] as const) : (['guest', owner.cartId] as const),
  cart: (owner: CartOwner) => [...cartKeys.owner(owner), 'cart'] as const,
  quote: (owner: CartOwner, network: string) => [...cartKeys.owner(owner), 'quote', network] as const,
}

export function useCartOwner(): CartOwner {
  const userId = useCurrentUserId()
  return userId ? { userId } : { cartId: getCartId() }
}

export function cartQuery(owner: CartOwner) {
  return queryOptions({
    queryKey: cartKeys.cart(owner),
    queryFn: ({ signal }) => fetchCart(signal),
  })
}

export function useCart() {
  return useQuery(cartQuery(useCartOwner()))
}

export function useCartCount(): number | undefined {
  return useQuery({ ...cartQuery(useCartOwner()), select: (cart: Cart) => cart.itemCount }).data
}

export function useAddToCart(options: { onAdded?: (cart: Cart) => void } = {}) {
  const owner = useCartOwner()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: AddCartItemRequest) => addCartItem(item),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(owner), cart)
      options.onAdded?.(cart)
    },
    onError: (error) => {
      toast.error(errorMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] }),
  })
}
