import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui'

export function NftNotFound() {
  return (
    <section className="page flex flex-col items-center gap-4 py-16 text-center">
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
