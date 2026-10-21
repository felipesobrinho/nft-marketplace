import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQuery, sessionStore } from '@/modules/auth'
import { isApiError } from '@/shared/domain/apiError'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context: { queryClient }, location, preload }) => {
    const session = sessionStore.get()
    if (!session) {
      throw redirect({
        to: '/entrar',
        search: {
          redirect: location.href,
          ...(sessionStore.wasExpired() ? { motivo: 'expirada' as const } : {}),
        },
      })
    }
    if (preload) return
    try {
      await queryClient.fetchQuery({ ...sessionQuery(session.userId), staleTime: 0 })
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        throw redirect({ to: '/entrar', search: { redirect: location.href, motivo: 'expirada' } })
      }
      throw error
    }
  },
  component: Outlet,
})
