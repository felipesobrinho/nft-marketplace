import { activeFilterCount } from '../domain/search'
import { useCatalogFacets, useCatalogList, useFeaturedNfts } from '../application/useCatalogData'
import { useCatalogSearch } from '../application/useCatalogSearch'
import { CatalogFilters } from './CatalogFilters'
import { CatalogGrid } from './CatalogGrid'
import { CatalogPagination } from './CatalogPagination'
import { CatalogToolbar } from './CatalogToolbar'
import { HomeHero } from './HomeHero'
import { MintJournal } from './MintJournal'
import { MobileCatalogBar } from './MobileCatalogBar'
import { PromoSection } from './PromoSection'
import { SpotlightCard } from './SpotlightCard'
import { errorMessage } from '@/shared/domain/apiError'

export function HomePage() {
  const { search, setFilter, clear } = useCatalogSearch()
  const { query: list, isUpdating } = useCatalogList(search)
  const featured = useFeaturedNfts()
  const { collections, networks } = useCatalogFacets()
  const filterCount = activeFilterCount(search)

  const filtersPanel = (
    <CatalogFilters
      search={search}
      collections={collections.data?.items}
      networks={networks.data?.items}
      priceRange={list.data?.priceRange}
      onFilter={setFilter}
      onClear={clear}
      isLoading={collections.isPending || networks.isPending}
    />
  )

  return (
    <>
      <MobileCatalogBar filterCount={filterCount} filtersSlot={filtersPanel} defaultQuery={search.q} />
      <HomeHero
        slides={featured.data?.hero}
        isLoading={featured.isPending}
        isError={featured.isError}
        onRetry={() => void featured.refetch()}
      />
      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="page scroll-mt-24 pt-6 pb-12 md:pt-12"
      >
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo de NFTs
        </h2>
        <div className="grid gap-8 md:grid-cols-[15rem_1fr] lg:grid-cols-[18rem_1fr]">
          <aside aria-label="Filtros do catálogo" className="hidden flex-col gap-6 md:flex">
            {filtersPanel}
            <SpotlightCard nft={featured.data?.spotlight} isLoading={featured.isPending} />
          </aside>
          <div className="flex min-w-0 flex-col gap-6">
            <CatalogToolbar
              tab={search.tab}
              sort={search.sort}
              onTabChange={(tab) => setFilter({ tab })}
              onSortChange={(sort) => setFilter({ sort })}
              total={list.data?.total}
              isUpdating={isUpdating}
            />
            <CatalogGrid
              items={list.data?.items}
              isLoading={list.isPending}
              isError={list.isError}
              errorMessage={list.isError ? errorMessage(list.error) : undefined}
              onRetry={() => void list.refetch()}
              isUpdating={isUpdating}
              onClear={clear}
              hasFilters={filterCount > 0}
            />
            <CatalogPagination page={search.page} totalPages={list.data?.totalPages ?? 0} />
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-16">
        <PromoSection />
        <MintJournal />
      </div>
    </>
  )
}
