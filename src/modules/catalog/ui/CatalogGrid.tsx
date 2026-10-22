import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { NftSummary } from '@/shared/contracts/catalog'
import { NftCard } from '@/shared/ui/commerce/NftCard'
import { NftCardSkeleton } from '@/shared/ui/commerce/NftCardSkeleton'
import { Button } from '@/shared/ui/components/ui/button'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { cn } from '@/shared/ui/lib/utils'

interface CatalogGridProps {
  items: NftSummary[] | undefined
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  onRetry: () => void
  isUpdating: boolean
  onClear: () => void
  hasFilters: boolean
  renderFavorite?: (nft: NftSummary) => ReactNode
}

const gridClass = 'grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6'
const skeletonKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
const badgeLabels = { rare: 'Raro', new: 'Novo' } as const

export function CatalogGrid({
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  isUpdating,
  onClear,
  hasFilters,
  renderFavorite,
}: CatalogGridProps) {
  if (isLoading && !items) {
    return (
      <div className={gridClass} aria-busy="true">
        {skeletonKeys.map((key) => (
          <NftCardSkeleton key={key} />
        ))}
      </div>
    )
  }

  if (isError && !items) {
    return <ErrorState message={errorMessage ?? 'Tente novamente em instantes.'} onRetry={onRetry} />
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="Nenhum NFT encontrado"
        description="Ajuste a busca ou os filtros para ver outros resultados."
        action={
          hasFilters ? (
            <Button type="button" variant="outline" onClick={onClear}>
              Limpar filtros
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div aria-busy={isUpdating} className={cn(gridClass, 'transition-opacity', isUpdating && 'opacity-60')}>
      {items.map((nft, index) => (
        <NftCard
          key={nft.id}
          name={nft.name}
          image={{ src: nft.image.src, alt: nft.image.alt }}
          price={nft.price}
          {...(nft.previousPrice ? { previousPrice: nft.previousPrice } : {})}
          {...(nft.badge ? { badge: badgeLabels[nft.badge] } : {})}
          soldOut={nft.availability === 'sold_out'}
          priority={index < 3}
          imageSizes="(min-width: 1024px) 282px, 50vw"
          renderLink={({ className, children }) => (
            <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
              {children}
            </Link>
          )}
          {...(renderFavorite ? { favoriteSlot: renderFavorite(nft) } : {})}
        />
      ))}
    </div>
  )
}
