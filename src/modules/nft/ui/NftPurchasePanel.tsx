import { Link, useNavigate } from '@tanstack/react-router'
import { Link2, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAddToCart } from '@/modules/cart'
import { FavoriteButton } from '@/modules/favorites'
import type { NftDetail } from '@/shared/contracts/catalog'
import { networkNames } from '@/shared/contracts/common'
import { multiplyEth } from '@/shared/domain/eth'
import { formatCount, formatRating, formatTokenId } from '@/shared/domain/format'
import { Button, EthAmount, QuantityStepper } from '@/shared/ui'
import { cn } from '@/shared/ui/lib/utils'
import {
  clampQuantity,
  defaultEdition,
  editionDisplayLabel,
  editionLimit,
  isEditionAvailable,
} from '../domain/edition'

export interface NftPurchasePanelProps {
  nft: NftDetail
  editionId: string
  onEditionChange: (editionId: string) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  layout: 'desktop' | 'mobile'
}

function useNftPurchase(nft: NftDetail, editionId: string, quantity: number) {
  const navigate = useNavigate()
  const edition = nft.editions.find((item) => item.id === editionId) ?? defaultEdition(nft)
  const limit = editionLimit(edition)
  const safeQuantity = clampQuantity(quantity, limit)
  const addToCart = useAddToCart({
    onAdded: () => {
      toast.success('Adicionado ao carrinho', {
        description: `${nft.name} · ${editionDisplayLabel(edition.label)} · ${safeQuantity} un.`,
        action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
      })
    },
  })
  return { edition, limit, safeQuantity, addToCart, total: multiplyEth(edition.price, safeQuantity) }
}

function AddToCartButton({
  nft,
  editionId,
  quantity,
  className,
}: {
  nft: NftDetail
  editionId: string
  quantity: number
  className?: string
}) {
  const { edition, limit, safeQuantity, addToCart } = useNftPurchase(nft, editionId, quantity)
  const label = limit.soldOut
    ? 'Edição esgotada'
    : addToCart.isPending
      ? 'Adicionando…'
      : 'Adicionar ao carrinho'
  return (
    <Button
      type="button"
      disabled={limit.soldOut || addToCart.isPending}
      onClick={() => addToCart.mutate({ nftId: nft.id, editionId: edition.id, quantity: safeQuantity })}
      className={className}
    >
      <ShoppingCart aria-hidden="true" />
      {label}
    </Button>
  )
}

function Rating({ nft, showLabel }: { nft: NftDetail; showLabel: boolean }) {
  const filled = Math.round(nft.rating.average)
  const average = nft.rating.average.toFixed(1).replace('.', ',')
  const spoken = `Nota ${average} de 5, ${formatCount(nft.rating.count)} avaliações`
  return (
    <div className="flex items-center gap-2 text-small text-muted-foreground">
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            className={cn('size-4 text-amber', index <= filled ? 'fill-current' : 'opacity-40')}
          />
        ))}
      </span>
      <span aria-hidden="true">
        {formatRating(nft.rating.average, nft.rating.count)}
        {showLabel ? ' avaliações de colecionadores' : null}
      </span>
    </div>
  )
}

export function NftPurchasePanel({
  nft,
  editionId,
  onEditionChange,
  quantity,
  onQuantityChange,
  layout,
}: NftPurchasePanelProps) {
  const { edition, limit, safeQuantity, total } = useNftPurchase(nft, editionId, quantity)
  const isDesktop = layout === 'desktop'
  const previous = nft.previousPrice !== null && edition.price === nft.price ? nft.previousPrice : undefined

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const stepper = (size: 'md' | 'sm') => (
    <QuantityStepper
      label="Quantidade"
      size={size}
      value={safeQuantity}
      onChange={(value) => onQuantityChange(value)}
      max={limit.max}
      disabled={limit.soldOut}
      {...(limit.reason ? { limitReason: limit.reason } : {})}
    />
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-heading font-bold text-foreground">{nft.name}</h1>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {isDesktop ? (
            <EthAmount value={edition.price} size="title" {...(previous ? { previous } : {})} />
          ) : null}
          <Rating nft={nft} showLabel={isDesktop} />
        </div>
      </div>
      {isDesktop ? <hr className="border-border" /> : null}
      <section aria-labelledby={`sobre-${layout}`} className="flex flex-col gap-2">
        <h2 id={`sobre-${layout}`} className="text-body font-bold text-foreground">
          Sobre este NFT
        </h2>
        <p className="text-small text-muted-foreground">{nft.description}</p>
      </section>
      <section aria-labelledby={`edicao-${layout}`} className="flex flex-col gap-2">
        <h2 id={`edicao-${layout}`} className="text-body font-bold text-foreground">
          Edição
        </h2>
        <ul className="flex flex-wrap gap-2">
          {nft.editions.map((item) => {
            const available = isEditionAvailable(item)
            const selected = item.id === editionId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={!available}
                  onClick={() => onEditionChange(item.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-small transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    selected
                      ? 'border-primary text-highlight'
                      : 'border-border-soft text-foreground hover:border-primary',
                  )}
                >
                  {editionDisplayLabel(item.label)}
                  {available ? null : <span className="text-caption text-muted-foreground">esgotada</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
      {isDesktop ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          {stepper('md')}
          <div className="flex flex-wrap gap-3">
            <AddToCartButton nft={nft} editionId={editionId} quantity={quantity} />
            <FavoriteButton nft={nft} variant="labeled" />
          </div>
        </div>
      ) : null}
      <dl className="flex flex-col gap-2 text-small">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-subtle">ID do token:</dt>
          <dd className="text-subtle">{formatTokenId(nft.tokenId)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Coleção:</dt>
          <dd>
            <Link
              to="/"
              search={{ collection: nft.collection.id }}
              hash="catalogo"
              className="text-muted-foreground underline underline-offset-4 hover:text-highlight"
            >
              {nft.collection.name}
            </Link>
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Rede:</dt>
          <dd className="text-muted-foreground">{networkNames[nft.network]}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">Atributos:</dt>
          <dd className="text-muted-foreground">{nft.attributes.join(', ')}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-body font-bold text-foreground">Compartilhar este NFT:</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
          <Link2 aria-hidden="true" />
          Copiar link
        </Button>
      </div>
      {isDesktop ? null : (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-3 rounded-t-lg bg-card p-4 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-small text-muted-foreground">Qtd.</span>
              {stepper('sm')}
            </div>
            <EthAmount value={total} size="title" />
          </div>
          <AddToCartButton nft={nft} editionId={editionId} quantity={quantity} className="w-full" />
        </div>
      )}
    </div>
  )
}
