import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { nftListQuery } from '@/modules/catalog'
import type { NftDetail } from '@/shared/contracts/catalog'
import { NftCard, NftCardSkeleton, SectionHeading } from '@/shared/ui'

const gridClass = 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'

export function MoreFromCollection({ nft }: { nft: NftDetail }) {
  const list = useQuery(
    nftListQuery({ collection: nft.collection.id, tab: 'all', sort: 'recent', page: 1, pageSize: 6 }),
  )
  const items = (list.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 5)

  if (list.isError || (!list.isPending && items.length === 0)) return null

  return (
    <section aria-labelledby="mais-colecao" className="page flex flex-col gap-6 py-8 md:py-12">
      <SectionHeading level={1} id="mais-colecao" title="Mais desta coleção" />
      {list.isPending ? (
        <div className={gridClass} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <ul className={gridClass}>
          {items.map((item) => (
            <li key={item.id}>
              <NftCard
                name={item.name}
                image={item.image}
                price={item.price}
                {...(item.previousPrice ? { previousPrice: item.previousPrice } : {})}
                soldOut={item.availability === 'sold_out'}
                renderLink={({ className, children }) => (
                  <Link to="/nft/$nftId" params={{ nftId: item.id }} className={className}>
                    {children}
                  </Link>
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
