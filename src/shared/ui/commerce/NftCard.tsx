import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/components/ui/badge'
import { cn } from '@/shared/ui/lib/utils'
import { EthAmount } from './EthAmount'
import { NftImage } from './NftImage'

export interface NftCardLinkProps {
  className: string
  children: ReactNode
}

export interface NftCardProps {
  name: string
  image: { src: string; alt: string }
  price: string
  previousPrice?: string
  badge?: string
  soldOut?: boolean
  renderLink: (props: NftCardLinkProps) => ReactNode
  favoriteSlot?: ReactNode
  headingLevel?: 'h2' | 'h3'
  imageSizes?: string
  priority?: boolean
}

const DEFAULT_SIZES = '(min-width: 1280px) 282px, (min-width: 768px) 30vw, 50vw'

export function NftCard({
  name,
  image,
  price,
  previousPrice,
  badge,
  soldOut = false,
  renderLink,
  favoriteSlot,
  headingLevel = 'h3',
  imageSizes = DEFAULT_SIZES,
  priority = false,
}: NftCardProps) {
  const Heading = headingLevel
  const label = soldOut ? 'Esgotado' : badge

  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-md has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="relative rounded-md border border-transparent bg-card p-3 transition-colors group-hover:border-primary">
        <div className={cn(soldOut && 'opacity-60')}>
          <NftImage src={image.src} alt={image.alt} sizes={imageSizes} priority={priority} />
        </div>
        {label ? (
          <Badge variant={soldOut ? 'secondary' : 'default'} className="absolute top-5 left-5 text-caption">
            {label}
          </Badge>
        ) : null}
        {favoriteSlot ? <div className="absolute top-5 right-5 z-10">{favoriteSlot}</div> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Heading className="line-clamp-2 min-h-[2lh] text-body-lg font-normal break-words text-foreground lg:line-clamp-1 lg:min-h-0">
          {renderLink({
            className: 'after:absolute after:inset-0 focus-visible:outline-none',
            children: name,
          })}
        </Heading>
        <EthAmount value={price} previous={previousPrice} size="body-lg" />
      </div>
    </article>
  )
}
