import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import {
  catalogSearchDefaults,
  catalogSearchSchema,
  collectionsQuery,
  featuredQuery,
  HomePage,
  networksQuery,
  nftListQuery,
  toListQuery,
} from '@/modules/catalog'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    void Promise.all([
      queryClient.ensureQueryData(nftListQuery(toListQuery(search))),
      queryClient.ensureQueryData(featuredQuery()),
      queryClient.ensureQueryData(collectionsQuery()),
      queryClient.ensureQueryData(networksQuery()),
    ]).catch(() => undefined)
  },
  head: () => ({
    meta: [
      { title: 'Kurio | Marketplace de NFTs' },
      {
        name: 'description',
        content:
          'Descubra, filtre e colecione NFTs de criadores emergentes e consagrados na Kurio. Arte digital com procedência registrada.',
      },
    ],
  }),
  component: HomePage,
})
