import { lazyRouteComponent } from '@tanstack/react-router'
export {
  catalogKeys,
  collectionsQuery,
  featuredQuery,
  networksQuery,
  nftListQuery,
} from './application/queries'
export { catalogSearchDefaults, catalogSearchSchema, type CatalogSearch, toListQuery } from './domain/search'
export { CatalogSearchForm } from './ui/CatalogSearchForm'

export const HomePage = lazyRouteComponent(() => import('./ui/HomePage'), 'HomePage')
export { HomePreview } from './ui/HomePreview'
