import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthScreen, safeRedirect, sessionStore } from '@/modules/auth'

export const Route = createFileRoute('/cadastro')({
  validateSearch: z.object({
    redirect: z.string().startsWith('/').optional().catch(undefined),
  }),
  beforeLoad: ({ search }) => {
    if (sessionStore.getToken()) throw redirect({ href: safeRedirect(search.redirect) })
  },
  head: () => ({ meta: [{ title: 'Criar conta | Kurio' }] }),
  component: RegisterRoutePage,
})

function RegisterRoutePage() {
  const search = Route.useSearch()
  return <AuthScreen mode="register" redirect={search.redirect} />
}
