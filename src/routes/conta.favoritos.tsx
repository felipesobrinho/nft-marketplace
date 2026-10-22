import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/conta/favoritos')({
  head: () => ({ meta: [{ title: 'Favoritos | Kurio' }] }),
  component: FavoritesRoutePage,
})

function FavoritesRoutePage() {
  return (
    <section className="page py-12">
      <h1 className="text-heading font-bold">Lista de interesse</h1>
    </section>
  )
}
