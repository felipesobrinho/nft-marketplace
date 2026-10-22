import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { FavoriteButton } from '@/modules/favorites'
import { MobileTopBar } from '@/shared/ui/layout/MobileTopBar'
import { nftDetailQuery } from '../application/queries'
import { clampQuantity, defaultEdition, editionLimit } from '../domain/edition'
import { MoreFromCollection } from './MoreFromCollection'
import { NftGallery } from './NftGallery'
import { NftPurchasePanel } from './NftPurchasePanel'
import { NftTabs } from './NftTabs'

interface Selection {
  nftId: string
  editionId: string
  quantity: number
}

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const { data: nft } = useSuspenseQuery(nftDetailQuery(nftId))
  const [selection, setSelection] = useState<Selection | null>(null)

  const current = selection?.nftId === nft.id ? selection : null
  const fallback = defaultEdition(nft)
  const editionId =
    current && nft.editions.some((item) => item.id === current.editionId) ? current.editionId : fallback.id
  const edition = nft.editions.find((item) => item.id === editionId) ?? fallback
  const quantity = clampQuantity(current?.quantity ?? 1, editionLimit(edition))

  const panelProps = {
    nft,
    editionId,
    quantity,
    onEditionChange: (next: string) => {
      const target = nft.editions.find((item) => item.id === next) ?? fallback
      setSelection({
        nftId: nft.id,
        editionId: next,
        quantity: clampQuantity(quantity, editionLimit(target)),
      })
    },
    onQuantityChange: (next: number) => {
      setSelection({ nftId: nft.id, editionId, quantity: clampQuantity(next, editionLimit(edition)) })
    },
  }

  return (
    <div className="pb-44 md:pb-0">
      <MobileTopBar backTo={{ to: '/' }} action={<FavoriteButton nft={nft} variant="icon" />} />
      <nav aria-label="Trilha de navegação" className="page hidden pt-6 pb-4 text-small md:block">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/" className="font-bold text-foreground hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              to="/"
              hash="catalogo"
              aria-current="page"
              className="font-bold text-foreground hover:text-highlight"
            >
              Mercado
            </Link>
          </li>
        </ol>
      </nav>
      <div className="page grid gap-6 md:grid-cols-2 md:gap-8">
        <NftGallery nft={nft} />
        <div className="hidden md:block">
          <NftPurchasePanel {...panelProps} layout="desktop" />
        </div>
        <div className="md:hidden">
          <NftPurchasePanel {...panelProps} layout="mobile" />
        </div>
      </div>
      <NftTabs nft={nft} />
      <MoreFromCollection nft={nft} />
    </div>
  )
}
