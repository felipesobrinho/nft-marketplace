import { Skeleton } from '@/shared/ui/components/ui/skeleton'

export function OrderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando pedido" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-7 w-64" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-6" />
    </div>
  )
}
