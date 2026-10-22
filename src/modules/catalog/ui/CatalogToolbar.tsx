import { Loader2 } from 'lucide-react'
import { useId } from 'react'
import { type CatalogSort, type CatalogTab, catalogSorts } from '@/shared/contracts/catalog'
import { formatCount } from '@/shared/domain/format'
import { Label } from '@/shared/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/components/ui/select'
import { cn } from '@/shared/ui/lib/utils'

interface CatalogToolbarProps {
  tab: CatalogTab
  sort: CatalogSort
  onTabChange: (tab: CatalogTab) => void
  onSortChange: (sort: CatalogSort) => void
  total: number | undefined
  isUpdating: boolean
}

const tabs: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

const sortLabels: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name_asc: 'Nome, de A a Z',
  name_desc: 'Nome, de Z a A',
}

function isSort(value: string): value is CatalogSort {
  return catalogSorts.some((sort) => sort === value)
}

export function CatalogToolbar({
  tab,
  sort,
  onTabChange,
  onSortChange,
  total,
  isUpdating,
}: CatalogToolbarProps) {
  const selectId = useId()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div
          role="group"
          aria-label="Abas do catálogo"
          className="-mx-6 flex max-w-[calc(100%+3rem)] flex-nowrap gap-x-4 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:max-w-none md:gap-x-6 md:overflow-visible md:px-0"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'min-h-11 border-b-2 text-small whitespace-nowrap transition-colors md:text-body',
                tab === item.id
                  ? 'border-primary font-bold text-highlight'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Label htmlFor={selectId} className="text-small text-muted-foreground">
            Ordenar por
          </Label>
          <Select
            value={sort}
            onValueChange={(value) => {
              if (isSort(value)) onSortChange(value)
            }}
          >
            <SelectTrigger id={selectId} className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {catalogSorts.map((option) => (
                <SelectItem key={option} value={option}>
                  {sortLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div aria-live="polite" className="flex min-h-5 items-center gap-3 text-small text-muted-foreground">
        {total !== undefined ? <span>{formatCount(total)} resultados</span> : null}
        {isUpdating ? (
          <span className="flex items-center gap-2">
            <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            Atualizando…
          </span>
        ) : null}
      </div>
    </div>
  )
}
