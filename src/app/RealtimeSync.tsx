import { useCartRealtime } from '@/modules/cart'
import { useCatalogRealtime } from '@/modules/catalog'
import { useFavoritesRealtime } from '@/modules/favorites'
import { useNftRealtime } from '@/modules/nft'
import { useOrderRealtime } from '@/modules/orders'

export function RealtimeSync() {
  useCatalogRealtime()
  useNftRealtime()
  useFavoritesRealtime()
  useCartRealtime()
  useOrderRealtime()
  return null
}
