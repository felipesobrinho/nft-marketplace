import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/shared/ui/components/ui/button'
import { NftImage } from '@/shared/ui/commerce/NftImage'

interface PromoCardProps {
  src: string
  alt: string
  title: string
  description: string
  action: ReactNode
}

function PromoCard({ src, alt, title, description, action }: PromoCardProps) {
  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-md bg-card sm:grid-cols-2">
      <NftImage
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 288px, (min-width: 640px) 50vw, 100vw"
        className="h-full rounded-none"
      />
      <div className="flex flex-col items-start justify-center gap-6 p-6">
        <h3 className="text-title font-bold text-foreground">{title}</h3>
        <p className="text-small text-muted-foreground">{description}</p>
        {action}
      </div>
    </article>
  )
}

export function PromoSection() {
  return (
    <section aria-label="Promoções" className="page">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PromoCard
          src="/nfts/emerald-ape"
          alt="Macaco de óculos escuros e jaqueta verde em retrato digital"
          title="Lançamentos gênesis de edição limitada"
          description="Colecione edições escassas diretamente dos criadores antes da revelação pública."
          action={
            <Button asChild size="sm">
              <Link to="/" search={{ tab: 'new' }} hash="catalogo">
                Explorar
                <span className="sr-only"> lançamentos gênesis</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <PromoCard
          src="/nfts/ivory-baron"
          alt="Macaco de pelagem escura com blazer claro em retrato digital"
          title="Arte digital selecionada e muito mais"
          description="Explore novos artistas, coleções verificadas e obras digitais que definem a cultura."
          action={
            <Button asChild size="sm">
              <Link to="/" search={{ collection: 'arte-digital' }} hash="catalogo">
                Explorar
                <span className="sr-only"> arte digital selecionada</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </div>
    </section>
  )
}
