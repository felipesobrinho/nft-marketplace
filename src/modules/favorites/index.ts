import { lazyRouteComponent } from '@tanstack/react-router'

export {
  favoriteKeys,
  favoritesQuery,
  useFavorites,
  useIsFavorite,
  useToggleFavorite,
} from './application/favorites'
export { useFavoritesRealtime } from './application/realtime'
export { FavoriteButton } from './ui/FavoriteButton'

export const FavoritesPage = lazyRouteComponent(() => import('./ui/FavoritesPage'), 'FavoritesPage')
