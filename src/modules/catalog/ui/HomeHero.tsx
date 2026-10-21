import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { NftSummary } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/components/ui/button'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { ErrorState } from '@/shared/ui/feedback/ErrorState'
import { NftImage } from '@/shared/ui/commerce/NftImage'
import { cn } from '@/shared/ui/lib/utils'

export interface HomeHeroProps {
  slides: NftSummary[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

interface DotsProps {
  total: number
  active: number
  onSelect: (index: number) => void
}

function SlideDots({ total, active, onSelect }: DotsProps) {
  if (total < 2) return null
  return (
    <div className="flex items-center justify-center">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Mostrar destaque ${index + 1} de ${total}`}
          aria-current={index === active ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className="flex size-11 items-center justify-center rounded-full"
        >
          <span
            className={cn('block size-2 rounded-full', index === active ? 'bg-primary' : 'bg-border-soft')}
          />
        </button>
      ))}
    </div>
  )
}

function DesktopHero({ slides }: { slides: NftSummary[] }) {
  const [active, setActive] = useState(0)
  const current = slides[Math.min(active, slides.length - 1)]
  return (
    <div className="hidden items-center gap-12 md:grid md:grid-cols-2">
      <div className="flex flex-col items-start gap-6">
        <p className="text-small text-foreground">Bem-vindo à Kurio</p>
        <h1 className="text-display-sm font-bold tracking-wide text-foreground uppercase lg:text-display">
          Seja dono do futuro da arte digital
        </h1>
        <p className="max-w-md text-body text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
          artistas e tenha uma parte da cultura da internet.
        </p>
        <Button asChild size="lg">
          <Link to="/" hash="catalogo">
            Explorar
          </Link>
        </Button>
      </div>
      {current ? (
        <div className="flex flex-col items-center gap-2">
          <Link
            to="/nft/$nftId"
            params={{ nftId: current.id }}
            aria-label={`Ver ${current.name}`}
            className="block w-full max-w-[450px] rounded-lg"
          >
            <NftImage
              src={current.image.src}
              alt={current.image.alt}
              sizes="(min-width: 768px) 450px, 100vw"
              priority={active === 0}
            />
          </Link>
          <SlideDots total={slides.length} active={active} onSelect={setActive} />
        </div>
      ) : null}
    </div>
  )
}

function MobileHero({ slides }: { slides: NftSummary[] }) {
  const [active, setActive] = useState(0)
  const current = slides[Math.min(active, slides.length - 1)]
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <div className="grid grid-cols-[1fr_140px] items-center gap-4 rounded-lg bg-card p-4">
        <div className="flex flex-col items-start gap-3">
          <p className="text-small text-foreground">Bem-vindo à Kurio</p>
          <h1 className="text-title font-bold tracking-wide text-foreground uppercase">
            Seja dono da cultura digital
          </h1>
          <p className="text-small text-muted-foreground">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="inline-flex min-h-11 items-center gap-2 text-small font-bold text-highlight"
          >
            Explorar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {current ? (
          <Link
            to="/nft/$nftId"
            params={{ nftId: current.id }}
            aria-label={`Ver ${current.name}`}
            className="block rounded-lg"
          >
            <NftImage src={current.image.src} alt={current.image.alt} sizes="140px" priority={active === 0} />
          </Link>
        ) : null}
      </div>
      <SlideDots total={slides.length} active={active} onSelect={setActive} />
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden items-center gap-12 md:grid md:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-12 w-32" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="aspect-square w-full max-w-[450px] rounded-lg" />
          <div className="h-11" />
        </div>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        <Skeleton className="h-52 w-full" />
        <div className="h-11" />
      </div>
    </div>
  )
}

export function HomeHero({ slides, isLoading, isError, onRetry }: HomeHeroProps) {
  let content
  if (isError) {
    content = (
      <div className="flex min-h-[400px] items-center justify-center md:min-h-[520px]">
        <ErrorState message="Os destaques não foram carregados." onRetry={onRetry} />
      </div>
    )
  } else if (isLoading || !slides) {
    content = <HeroSkeleton />
  } else if (slides.length === 0) {
    content = null
  } else {
    content = (
      <>
        <DesktopHero slides={slides} />
        <MobileHero slides={slides} />
      </>
    )
  }
  return (
    <section aria-label="Destaques" className="page pt-6 md:py-8">
      {content}
    </section>
  )
}
