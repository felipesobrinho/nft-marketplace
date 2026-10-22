import { useState } from 'react'
import type { Facet } from '@/shared/contracts/catalog'
import type { NetworkId } from '@/shared/contracts/common'
import { formatEthNumber } from '@/shared/domain/format'
import { Button } from '@/shared/ui/components/ui/button'
import { Skeleton } from '@/shared/ui/components/ui/skeleton'
import { Slider } from '@/shared/ui/components/ui/slider'
import { cn } from '@/shared/ui/lib/utils'
import {
  activeFilterCount,
  type CatalogFilterPatch,
  type CatalogSearch,
  normalizePriceRange,
  toggleValue,
} from '../domain/search'

interface CatalogFiltersProps {
  search: CatalogSearch
  collections: Facet[] | undefined
  networks: Facet[] | undefined
  priceRange: { min: string; max: string } | undefined
  onFilter: (patch: CatalogFilterPatch) => void
  onClear: () => void
  isLoading: boolean
}

const networkIds: NetworkId[] = ['ethereum', 'polygon', 'solana']

function isNetworkId(value: string): value is NetworkId {
  return networkIds.some((id) => id === value)
}

function toDecimal(value: number): string {
  return value.toFixed(2)
}

interface FacetListProps {
  title: string
  items: Facet[] | undefined
  selected: string | undefined
  isLoading: boolean
  onToggle: (id: string) => void
}

function FacetList({ title, items, selected, isLoading, onToggle }: FacetListProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-body-lg font-bold text-foreground">{title}</h2>
      {isLoading && !items ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {['a', 'b', 'c', 'd'].map((key) => (
            <Skeleton key={key} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {items?.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={selected === item.id}
                onClick={() => onToggle(item.id)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-2 text-left text-small transition-colors hover:bg-surface-raised',
                  selected === item.id ? 'font-bold text-highlight' : 'text-muted-foreground',
                )}
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="shrink-0 text-right tabular-nums">({item.count})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CatalogFilters({
  search,
  collections,
  networks,
  priceRange,
  onFilter,
  onClear,
  isLoading,
}: CatalogFiltersProps) {
  const [draft, setDraft] = useState<[number, number] | null>(null)
  const lower = priceRange ? Number(priceRange.min) : 0
  const upper = priceRange ? Number(priceRange.max) : 0
  const fromSearch: [number, number] = [
    Math.min(Math.max(search.minPrice ? Number(search.minPrice) : lower, lower), upper),
    Math.min(Math.max(search.maxPrice ? Number(search.maxPrice) : upper, lower), upper),
  ]
  const values = draft ?? fromSearch
  const count = activeFilterCount(search)

  function applyPrice() {
    onFilter(normalizePriceRange(toDecimal(values[0]), toDecimal(values[1])))
    setDraft(null)
  }

  function clearAll() {
    setDraft(null)
    onClear()
  }

  return (
    <div className="flex flex-col gap-6 rounded-md bg-card p-6">
      <FacetList
        title="Coleções"
        items={collections}
        selected={search.collection}
        isLoading={isLoading}
        onToggle={(id) => onFilter({ collection: toggleValue(search.collection, id) })}
      />
      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-bold text-foreground">Faixa de preço</h2>
        {priceRange ? (
          <>
            <Slider
              thumbLabels={['Preço mínimo', 'Preço máximo']}
              min={lower}
              max={upper}
              step={0.01}
              value={values}
              onValueChange={(next) => {
                const [a, b] = next
                if (a !== undefined && b !== undefined) setDraft([a, b])
              }}
              className="py-3"
            />
            <p className="text-small text-muted-foreground">
              Preço: {formatEthNumber(toDecimal(values[0]))} – {formatEthNumber(toDecimal(values[1]))} ETH
            </p>
            <Button type="button" size="sm" className="self-start" onClick={applyPrice}>
              Aplicar
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        )}
      </section>
      <FacetList
        title="Rede"
        items={networks}
        selected={search.network}
        isLoading={isLoading}
        onToggle={(id) => {
          if (isNetworkId(id)) onFilter({ network: toggleValue(search.network, id) })
        }}
      />
      {count > 0 ? (
        <Button type="button" variant="ghost" onClick={clearAll}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
