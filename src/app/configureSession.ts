import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { expireSession, onSessionEvent } from '@/modules/auth'
import { describeAdjustment, mergeGuestCart } from '@/modules/cart'
import { discardCheckoutDrafts } from '@/modules/checkout'
import { configureRequestContext } from '@/shared/infrastructure/http'
import { writeJson } from '@/shared/infrastructure/storage'
import type { createAppRouter } from './router'

type AppRouter = ReturnType<typeof createAppRouter>

export const RESUME_KEY = 'resume'

export function configureSession(router: AppRouter, queryClient: QueryClient): void {
  const whenRouterSettled = (action: () => void, attempt = 0) => {
    if ((router.state.status === 'idle' && !router.state.isLoading) || attempt >= 60) {
      action()
      return
    }
    window.setTimeout(() => whenRouterSettled(action, attempt + 1), 50)
  }

  configureRequestContext({
    onUnauthorized: () => {
      void expireSession().then((expired) => {
        if (!expired) return
        whenRouterSettled(() => {
          if (router.state.location.pathname === '/entrar') return
          const href = router.state.location.href
          writeJson(RESUME_KEY, { href }, 'session')
          void router.navigate({ to: '/entrar', search: { redirect: href, motivo: 'expirada' } })
        })
      })
    },
  })

  onSessionEvent(async (event) => {
    const previous = event.previousUserId
    const switched = event.type === 'signed-in' && previous !== null && previous !== event.session.userId
    if (previous && (event.type === 'signed-out' || switched)) {
      await queryClient.cancelQueries({ queryKey: ['user', previous] })
      queryClient.removeQueries({ queryKey: ['user', previous] })
    }
    if (event.type === 'signed-out' && event.reason === 'logout') discardCheckoutDrafts(null)
    if (event.type === 'signed-in') {
      discardCheckoutDrafts(event.session.userId)
      try {
        const adjustments = await mergeGuestCart(queryClient, event.session.userId)
        for (const adjustment of adjustments) toast.warning(describeAdjustment(adjustment))
      } catch {
        toast.error(
          'Não foi possível juntar o carrinho de visitante. Os itens continuam salvos neste navegador.',
        )
      }
    }
  })
}
