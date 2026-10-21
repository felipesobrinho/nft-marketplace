import { HeaderCartLink } from '@/shared/ui/layout'
import { useCartCount } from '../application/queries'

export function CartHeaderLink() {
  return <HeaderCartLink count={useCartCount()} />
}
