import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/modules/favorites'

export const Route = createFileRoute('/_authenticated/conta/favoritos')({
  head: () => ({ meta: [{ title: 'Lista de interesse | Kurio' }] }),
  component: FavoritesPage,
})
