import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/modules/profile'

export const Route = createFileRoute('/_authenticated/conta/perfil')({
  head: () => ({ meta: [{ title: 'Perfil | Kurio' }] }),
  component: ProfilePage,
})
