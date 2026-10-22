import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { Button } from '@/shared/ui'

export function NftNotFound() {
  return (
    <section className="page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <SearchX aria-hidden="true" className="size-12 text-highlight" />
      <h1 className="text-heading font-bold text-foreground">NFT não encontrado</h1>
      <p className="text-small text-muted-foreground">
        O NFT que você procurou não existe ou foi removido do catálogo.
      </p>
      <Button asChild>
        <Link to="/" hash="catalogo">
          Voltar ao catálogo
        </Link>
      </Button>
    </section>
  )
}
