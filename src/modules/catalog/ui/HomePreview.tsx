import { useQuery } from '@tanstack/react-query'
import { nftListQuery } from '../application/queries'
import { useFeaturedNfts } from '../application/useCatalogData'
import { CatalogGrid } from './CatalogGrid'
import { HomeHero } from './HomeHero'

const noop = () => undefined

export function HomePreview() {
  const featured = useFeaturedNfts()
  const list = useQuery(nftListQuery({ tab: 'all', sort: 'recent', page: 1, pageSize: 9 }))

  return (
    <div inert aria-hidden="true">
      <HomeHero
        slides={featured.data?.hero}
        isLoading={featured.isPending}
        isError={featured.isError}
        onRetry={noop}
      />
      <section className="page pt-6 pb-12 md:pt-12">
        <CatalogGrid
          items={list.data?.items}
          isLoading={list.isPending}
          isError={list.isError}
          onRetry={noop}
          isUpdating={false}
          onClear={noop}
          hasFilters={false}
        />
      </section>
    </div>
  )
}
