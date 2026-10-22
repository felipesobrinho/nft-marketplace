import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUserId } from '@/modules/auth'
import type { NftSummary } from '@/shared/contracts/catalog'
import { errorMessage } from '@/shared/domain/apiError'
import { addFavorite, fetchFavorites, removeFavorite } from '../infrastructure/favoritesApi'

type FavoriteList = { items: NftSummary[] }

export const favoriteKeys = {
  list: (userId: string) => ['user', userId, 'favorites'] as const,
}

export function favoritesQuery(userId: string) {
  return queryOptions({
    queryKey: favoriteKeys.list(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
  })
}

export function useFavorites() {
  const userId = useCurrentUserId()
  return useQuery({ ...favoritesQuery(userId ?? 'anonimo'), enabled: userId !== null })
}

export function useIsFavorite(nftId: string): boolean {
  const userId = useCurrentUserId()
  const { data } = useQuery({
    ...favoritesQuery(userId ?? 'anonimo'),
    enabled: userId !== null,
    select: (list: FavoriteList) => list.items.some((item) => item.id === nftId),
  })
  return data ?? false
}

export interface ToggleFavoriteInput {
  nft: NftSummary
  favorite: boolean
}

export function useToggleFavorite(
  options: { onResult?: (input: ToggleFavoriteInput, ok: boolean) => void } = {},
) {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  const key = favoriteKeys.list(userId ?? 'anonimo')

  return useMutation({
    mutationFn: ({ nft, favorite }: ToggleFavoriteInput) =>
      favorite ? addFavorite(nft.id) : removeFavorite(nft.id),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoriteList>(key)
      queryClient.setQueryData<FavoriteList>(key, (current) => {
        const items = (current?.items ?? []).filter((item) => item.id !== nft.id)
        return { items: favorite ? [nft, ...items] : items }
      })
      return { previous }
    },
    onError: (error, input, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(errorMessage(error))
      options.onResult?.(input, false)
    },
    onSuccess: (_result, input) => {
      options.onResult?.(input, true)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
