import { useState } from 'react'
import { ZoomIn } from 'lucide-react'
import type { NftDetail } from '@/shared/contracts/catalog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, NftImage } from '@/shared/ui'
import { cn } from '@/shared/ui/lib/utils'

const THUMBNAILS = [1, 2, 3, 4]

export function NftGallery({ nft }: { nft: NftDetail }) {
  const [selected, setSelected] = useState(1)

  return (
    <div className="flex items-start gap-4">
      <ul aria-label="Miniaturas" className="hidden w-22 shrink-0 flex-col gap-3 md:flex">
        {THUMBNAILS.map((index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Ver imagem ${index} de ${THUMBNAILS.length}`}
              aria-current={selected === index ? 'true' : undefined}
              onClick={() => setSelected(index)}
              className={cn(
                'block w-full rounded-md border bg-card p-1 transition-colors',
                selected === index ? 'border-primary' : 'border-transparent hover:border-border-soft',
              )}
            >
              <NftImage src={nft.image.src} alt="" sizes="88px" className="rounded-sm" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative min-w-0 flex-1 rounded-md bg-card p-4">
        <NftImage src={nft.image.src} alt={nft.image.alt} sizes="(min-width: 768px) 440px, 100vw" priority />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Ampliar imagem de ${nft.name}`}
              className="absolute top-7 right-7 inline-flex size-11 items-center justify-center rounded-full bg-background/80 text-highlight transition-colors hover:bg-background"
            >
              <ZoomIn aria-hidden="true" className="size-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,1080px)] p-4 sm:max-w-[min(90vw,1080px)]">
            <DialogTitle>{nft.name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada de {nft.name}</DialogDescription>
            <NftImage src={nft.image.src} alt={nft.image.alt} sizes="min(90vw, 1080px)" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
