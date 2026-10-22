import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { nftListQuery } from '@/modules/catalog'
import { FavoriteButton } from '@/modules/favorites'
import { NftCard } from '@/shared/ui/commerce/NftCard'
import { SectionHeading } from '@/shared/ui/SectionHeading'

const VISIBLE = 5

export function AlsoViewed({ excludeNftIds }: { excludeNftIds: readonly string[] }) {
  const { data } = useQuery(nftListQuery({ tab: 'trending', sort: 'recent', page: 1, pageSize: VISIBLE }))
  const items = (data?.items ?? []).filter((nft) => !excludeNftIds.includes(nft.id)).slice(0, VISIBLE)

  if (items.length === 0) return null

  return (
    <section aria-labelledby="also-viewed-title" className="flex flex-col gap-6">
      <SectionHeading level={1} id="also-viewed-title" title="Colecionadores também viram" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((nft) => (
          <NftCard
            key={nft.id}
            name={nft.name}
            image={{ src: nft.image.src, alt: nft.image.alt }}
            price={nft.price}
            {...(nft.previousPrice ? { previousPrice: nft.previousPrice } : {})}
            soldOut={nft.availability === 'sold_out'}
            imageSizes="(min-width: 1280px) 214px, (min-width: 768px) 30vw, 50vw"
            renderLink={({ className, children }) => (
              <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
                {children}
              </Link>
            )}
            favoriteSlot={<FavoriteButton nft={nft} variant="icon" />}
          />
        ))}
      </div>
    </section>
  )
}
