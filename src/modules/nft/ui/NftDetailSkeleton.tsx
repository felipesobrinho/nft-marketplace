import { Skeleton } from '@/shared/ui'

export function NftDetailSkeleton() {
  return (
    <div className="page flex flex-col gap-8 pt-6 pb-40 md:pb-12" role="status" aria-label="Carregando NFT">
      <Skeleton className="hidden h-5 w-32 md:block" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex gap-4">
          <div className="hidden w-22 shrink-0 flex-col gap-3 md:flex">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="aspect-square w-full" />
            ))}
          </div>
          <Skeleton className="aspect-square min-w-0 flex-1" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-11 w-20 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-48" />
            <Skeleton className="h-11 w-32" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}
