import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMemo } from 'react'
import { applyFilter, type CatalogFilterPatch, clearFilters } from '../domain/search'

export function useCatalogSearch() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  return useMemo(
    () => ({
      search,
      setFilter: (patch: CatalogFilterPatch) => {
        void navigate({ search: (previous) => applyFilter(previous, patch), resetScroll: false })
      },
      clear: () => {
        void navigate({ search: clearFilters, resetScroll: false })
      },
    }),
    [search, navigate],
  )
}
