import { Skeleton } from '@/shared/ui/components/ui/skeleton'

export function CartSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o carrinho"
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-12"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-56 md:h-24" />
        <Skeleton className="h-56 md:h-24" />
        <Skeleton className="h-56 md:h-24" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[26rem]" />
      </div>
    </div>
  )
}
