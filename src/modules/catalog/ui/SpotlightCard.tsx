import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/shared/contracts/catalog'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { EthAmount } from '@/shared/ui/commerce/EthAmount'
import { NftImage } from '@/shared/ui/commerce/NftImage'

export interface SpotlightCardProps {
  nft: NftSummary | null | undefined
  isLoading: boolean
}

export function SpotlightCard({ nft, isLoading }: SpotlightCardProps) {
  if (isLoading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-4 rounded-md bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
    )
  }
  if (!nft) return null
  return (
    <section aria-labelledby="spotlight-title" className="flex flex-col gap-4 rounded-md bg-card p-6">
      <div className="flex flex-col gap-1">
        <p className="text-small font-bold text-highlight">NFT em destaque</p>
        <h2 id="spotlight-title" className="text-title font-bold text-foreground">
          Oferta limitada
        </h2>
      </div>
      <NftImage src={nft.image.src} alt={nft.image.alt} sizes="(min-width: 1024px) 280px, 100vw" />
      <div className="flex flex-col gap-1">
        <p className="text-body-lg font-bold text-foreground">{nft.name}</p>
        <EthAmount value={nft.price} previous={nft.previousPrice ?? undefined} size="body-lg" />
      </div>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="inline-flex min-h-11 items-center text-small font-bold text-highlight underline-offset-4 hover:underline"
      >
        Ver NFT
        <span className="sr-only">: {nft.name}</span>
      </Link>
    </section>
  )
}
