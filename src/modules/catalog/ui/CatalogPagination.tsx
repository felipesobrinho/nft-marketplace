import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/ui/lib/utils'

interface CatalogPaginationProps {
  page: number
  totalPages: number
}

type PageItem = number | 'gap-start' | 'gap-end'

function buildItems(page: number, totalPages: number): PageItem[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const numbers = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const items: PageItem[] = []
  numbers.forEach((n, index) => {
    const previous = numbers[index - 1]
    if (previous !== undefined && n - previous > 1) items.push(index === 1 ? 'gap-start' : 'gap-end')
    items.push(n)
  })
  return items
}

const box = 'flex size-11 items-center justify-center rounded-sm text-body'

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) return null
  const items = buildItems(page, totalPages)

  return (
    <nav aria-label="Paginação do catálogo">
      <ul className="flex flex-wrap items-center justify-end gap-2">
        <li>
          {page > 1 ? (
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page - 1 })}
              hash="catalogo"
              aria-label="Página anterior"
              className={cn(box, 'text-highlight hover:bg-surface-raised')}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, 'text-subtle opacity-50')}>
              <ChevronLeft className="size-5" />
            </span>
          )}
        </li>
        {items.map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true" className={cn(box, 'text-muted-foreground')}>
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, page: item })}
                hash="catalogo"
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  box,
                  'font-bold tabular-nums',
                  item === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-surface-raised',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page + 1 })}
              hash="catalogo"
              aria-label="Próxima página"
              className={cn(box, 'text-highlight hover:bg-surface-raised')}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, 'text-subtle opacity-50')}>
              <ChevronRight className="size-5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
