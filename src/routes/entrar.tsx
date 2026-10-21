import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthScreen, safeRedirect, sessionStore } from '@/modules/auth'

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({
    redirect: z.string().startsWith('/').optional().catch(undefined),
    motivo: z.enum(['expirada']).optional().catch(undefined),
  }),
  beforeLoad: ({ search }) => {
    if (sessionStore.getToken()) throw redirect({ href: safeRedirect(search.redirect) })
  },
  head: () => ({ meta: [{ title: 'Entrar | Kurio' }] }),
  component: LoginRoutePage,
})

function LoginRoutePage() {
  const search = Route.useSearch()
  return <AuthScreen mode="login" redirect={search.redirect} reason={search.motivo} />
}
