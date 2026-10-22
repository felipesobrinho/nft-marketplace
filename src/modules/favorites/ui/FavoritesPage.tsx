import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { NftCard } from '@/shared/ui/commerce/NftCard'
import { NftCardSkeleton } from '@/shared/ui/commerce/NftCardSkeleton'
import { buttonVariants } from '@/shared/ui/components/ui/button'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { useFavorites } from '../application/favorites'
import { FavoriteButton } from './FavoriteButton'

const gridClass = 'grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6'
const skeletonKeys = ['a', 'b', 'c', 'd', 'e', 'f']
const badgeLabels = { rare: 'Raro', new: 'Novo' } as const

export function FavoritesPage() {
  const favorites = useFavorites()
  const items = favorites.data?.items

  function renderBody() {
    if (!items && favorites.isError) {
      return (
        <ErrorState
          message="Verifique sua conexão e tente de novo."
          onRetry={() => void favorites.refetch()}
          isRetrying={favorites.isFetching}
        />
      )
    }
    if (!items) {
      return (
        <div className={gridClass} role="status" aria-busy="true" aria-label="Carregando a lista">
          {skeletonKeys.map((key) => (
            <NftCardSkeleton key={key} />
          ))}
        </div>
      )
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Heart className="size-6" />}
          title="Você ainda não favoritou nenhum NFT."
          action={
            <Link to="/" className={buttonVariants({ variant: 'outline' })}>
              Explorar NFTs
            </Link>
          }
        />
      )
    }
    return (
      <div className={gridClass}>
        {items.map((nft) => (
          <NftCard
            key={nft.id}
            name={nft.name}
            image={{ src: nft.image.src, alt: nft.image.alt }}
            price={nft.price}
            {...(nft.previousPrice ? { previousPrice: nft.previousPrice } : {})}
            {...(nft.badge ? { badge: badgeLabels[nft.badge] } : {})}
            soldOut={nft.availability === 'sold_out'}
            imageSizes="(min-width: 1024px) 282px, 50vw"
            renderLink={({ className, children }) => (
              <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
                {children}
              </Link>
            )}
            favoriteSlot={<FavoriteButton nft={nft} variant="icon" />}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading font-bold text-foreground">Lista de interesse</h1>
      {renderBody()}
    </div>
  )
}
