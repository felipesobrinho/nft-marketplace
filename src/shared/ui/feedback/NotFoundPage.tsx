import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <section className="page flex flex-col items-start gap-4 py-24" aria-labelledby="not-found-title">
      <p className="text-small text-subtle">Erro 404</p>
      <h1 id="not-found-title" className="text-heading font-bold">
        Página não encontrada
      </h1>
      <p className="text-body text-muted-foreground">O endereço que você abriu não existe ou foi removido.</p>
      <Link to="/" className="text-body-lg font-bold text-highlight underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </section>
  )
}
