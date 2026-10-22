import { sessionStore } from '@/modules/auth'
import { getCartId } from '@/modules/cart'
import { configureRequestContext } from '@/shared/infrastructure/http'

export function configureRequests(): void {
  configureRequestContext({
    token: () => sessionStore.getToken(),
    cartId: () => (sessionStore.getToken() ? null : getCartId()),
  })
}
