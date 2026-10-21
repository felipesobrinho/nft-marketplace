import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NetworkId } from '@/shared/contracts/common'
import type { Cart } from '@/shared/contracts/commerce'
import { multiplyEth, parseEth, sumWei, toEthString } from '@/shared/domain/eth'
import { errorMessage } from '@/shared/domain/apiError'
import {
  applyCoupon,
  createQuote,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '../infrastructure/cartApi'
import { type CartOwner, cartKeys, useCartOwner } from './queries'

function withQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const items = cart.items.map((item) =>
    item.id === itemId ? { ...item, quantity, lineTotal: multiplyEth(item.unitPrice, quantity) } : item,
  )
  return {
    ...cart,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: toEthString(
      sumWei(items.filter((item) => item.status !== 'sold_out').map((item) => parseEth(item.lineTotal))),
    ),
  }
}

function useCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Cart>,
  options: { optimistic?: (cart: Cart, variables: TVariables) => Cart; successMessage?: string } = {},
) {
  const owner = useCartOwner()
  const queryClient = useQueryClient()
  const key = cartKeys.cart(owner)
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      if (!options.optimistic) return { previous: undefined }
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Cart>(key)
      if (previous) queryClient.setQueryData<Cart>(key, options.optimistic(previous, variables))
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(key, cart)
      if (options.successMessage) toast.success(options.successMessage)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] }),
  })
}

export function useUpdateCartItem() {
  return useCartMutation(
    ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, quantity),
    { optimistic: (cart, { itemId, quantity }) => withQuantity(cart, itemId, quantity) },
  )
}

export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => removeCartItem(itemId), {
    optimistic: (cart, itemId) => {
      const items = cart.items.filter((item) => item.id !== itemId)
      return { ...cart, items, itemCount: items.reduce((total, item) => total + item.quantity, 0) }
    },
  })
}

export function useApplyCoupon() {
  const owner = useCartOwner()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => applyCoupon(code),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(owner), cart)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...cartKeys.owner(owner), 'quote'] }),
  })
}

export function useRemoveCoupon() {
  return useCartMutation(() => removeCoupon(), { successMessage: 'Cupom removido.' })
}

export function quoteQuery(owner: CartOwner, network: NetworkId, cartVersion: number) {
  return queryOptions({
    queryKey: [...cartKeys.quote(owner, network), cartVersion] as const,
    queryFn: ({ signal }) => createQuote(network, signal),
  })
}

export function useCartQuote(network: NetworkId, cart: Cart | undefined) {
  const owner = useCartOwner()
  return useQuery({
    ...quoteQuery(owner, network, cart?.version ?? 0),
    enabled: cart !== undefined && cart.items.length > 0,
  })
}
