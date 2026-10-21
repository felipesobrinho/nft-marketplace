export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col gap-3">
      <div className="rounded-md border border-transparent bg-card p-3">
        <div className="shimmer aspect-square w-full rounded-lg" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="shimmer h-6 w-3/4 rounded-sm" />
        <div className="shimmer h-6 w-1/2 rounded-sm" />
      </div>
    </div>
  )
}
