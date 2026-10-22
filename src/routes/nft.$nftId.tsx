import { createFileRoute, notFound } from '@tanstack/react-router'
import { NftDetailPage, NftDetailSkeleton, NftNotFound, nftDetailQuery } from '@/modules/nft'
import { isApiError } from '@/shared/domain/apiError'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      return await queryClient.ensureQueryData(nftDetailQuery(params.nftId))
    } catch (error) {
      if (isApiError(error) && error.is('not_found')) throw notFound()
      throw error
    }
  },
  pendingMs: 150,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: NftNotFound,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? 'NFT'} | Kurio` },
      { name: 'description', content: loaderData?.description ?? 'Detalhes do NFT na Kurio.' },
    ],
  }),
  component: NftDetailPage,
})
