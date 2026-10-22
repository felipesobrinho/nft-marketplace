import { SlidersHorizontal } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Badge } from '@/shared/ui/components/ui/badge'
import { Button } from '@/shared/ui/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/components/ui/sheet'
import { CatalogSearchForm } from './CatalogSearchForm'

interface MobileCatalogBarProps {
  filterCount: number
  filtersSlot: ReactNode
  defaultQuery?: string
}

export function MobileCatalogBar({ filterCount, filtersSlot, defaultQuery }: MobileCatalogBarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="page flex items-center gap-3 pt-6 md:hidden">
      <div className="min-w-0 flex-1">
        <CatalogSearchForm
          variant="mobile"
          {...(defaultQuery !== undefined ? { defaultValue: defaultQuery } : {})}
        />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary" size="icon" aria-label="Filtros" className="relative">
            <SlidersHorizontal aria-hidden="true" className="size-5 text-highlight" />
            {filterCount > 0 ? (
              <Badge className="absolute -top-1 -right-1 min-w-5 justify-center px-1.5">{filterCount}</Badge>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-title font-bold">Filtros</SheetTitle>
            <SheetDescription className="sr-only">
              Filtre o catálogo por coleção, preço e rede.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4">{filtersSlot}</div>
          <SheetFooter>
            <Button type="button" onClick={() => setOpen(false)}>
              Ver resultados
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
