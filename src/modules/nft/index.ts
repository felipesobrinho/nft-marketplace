import { lazyRouteComponent } from '@tanstack/react-router'

export { NftUpdateAnnouncer } from './ui/NftUpdateAnnouncer'
export { nftDetailQuery, nftKeys } from './application/queries'
export { useNftRealtime } from './application/realtime'
export { NftDetailSkeleton } from './ui/NftDetailSkeleton'
export { NftNotFound } from './ui/NftNotFound'

export const NftDetailPage = lazyRouteComponent(() => import('./ui/NftDetailPage'), 'NftDetailPage')
