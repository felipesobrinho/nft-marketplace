import { cn } from '@/shared/ui/lib/utils'

export interface NftImageProps {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

const WIDTHS = [320, 640, 1080]

function buildSrcSet(src: string, extension: string): string {
  return WIDTHS.map((width) => `${src}-${width}.${extension} ${width}w`).join(', ')
}

export function NftImage({ src, alt, sizes, priority = false, className }: NftImageProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet(src, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet(src, 'webp')} sizes={sizes} />
      <img
        src={`${src}-640.webp`}
        width={1080}
        height={1080}
        alt={alt}
        sizes={sizes}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('block aspect-square h-auto w-full rounded-lg object-cover', className)}
      />
    </picture>
  )
}
