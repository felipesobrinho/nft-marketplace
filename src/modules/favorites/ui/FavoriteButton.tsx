import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useCurrentUserId } from '@/modules/auth'
import type { NftSummary } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/components/ui/button'
import { useAnnounce } from '@/shared/ui/feedback/LiveAnnouncer'
import { cn } from '@/shared/ui/lib/utils'
import { useIsFavorite, useToggleFavorite } from '../application/favorites'

export interface FavoriteButtonProps {
  nft: NftSummary
  variant: 'icon' | 'labeled'
  className?: string
}

export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location.href })
  const announce = useAnnounce()
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite({
    onResult: (input, ok) => {
      if (!ok) {
        announce(`Não foi possível atualizar o favorito de ${input.nft.name}.`, 'assertive')
        return
      }
      announce(
        input.favorite ? `${input.nft.name} entrou nos favoritos.` : `${input.nft.name} saiu dos favoritos.`,
      )
    },
  })

  function handleClick() {
    if (!userId) {
      void navigate({ to: '/entrar', search: { redirect: location } })
      return
    }
    toggle.mutate({ nft, favorite: !isFavorite })
  }

  const label = isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={label}
        aria-busy={toggle.isPending}
        onClick={handleClick}
        className={cn(
          'inline-flex size-11 items-center justify-center rounded-full bg-background/80 text-highlight transition-colors hover:bg-background',
          className,
        )}
      >
        <Heart aria-hidden="true" className={cn('size-5', isFavorite && 'fill-current')} />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={isFavorite}
      aria-busy={toggle.isPending}
      onClick={handleClick}
      className={className}
    >
      <Heart aria-hidden="true" className={cn('size-5', isFavorite && 'fill-current')} />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
      <span className="sr-only"> {nft.name}</span>
    </Button>
  )
}
