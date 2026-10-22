import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  applyFilter,
  catalogSearchSchema,
  clearFilters,
  normalizePriceRange,
  toggleValue,
  toListQuery,
} from './search'

describe('estado da busca na URL', () => {
  it('aplica os padrões quando a URL está vazia', () => {
    expect(catalogSearchSchema.parse({})).toEqual({ tab: 'all', sort: 'recent', page: 1 })
  })

  it('descarta valores inválidos sem quebrar a página', () => {
    expect(
      catalogSearchSchema.parse({
        sort: 'mais-caro',
        page: '-3',
        network: 'bitcoin',
        minPrice: '1,5',
        tab: 'x',
      }),
    ).toEqual({ tab: 'all', sort: 'recent', page: 1 })
  })

  it('converte a página vinda da URL em número', () => {
    expect(catalogSearchSchema.parse({ page: '3' }).page).toBe(3)
  })

  it('mudar filtro volta para a página 1', () => {
    const search = catalogSearchSchema.parse({ page: '4', collection: 'musica' })
    expect(applyFilter(search, { network: 'polygon' })).toMatchObject({
      page: 1,
      collection: 'musica',
      network: 'polygon',
    })
    expect(applyFilter(search, { sort: 'price_asc' }).page).toBe(1)
  })

  it('clicar de novo no mesmo filtro desliga o filtro', () => {
    expect(toggleValue<string>('musica', 'musica')).toBeUndefined()
    expect(toggleValue<string>('musica', 'jogos')).toBe('jogos')
  })

  it('inverte a faixa de preço digitada ao contrário', () => {
    expect(normalizePriceRange('3', '1.5')).toEqual({ minPrice: '1.5', maxPrice: '3' })
    expect(normalizePriceRange('0.5', undefined)).toEqual({ minPrice: '0.5', maxPrice: undefined })
  })

  it('conta e limpa filtros ativos mantendo aba e ordenação', () => {
    const search = catalogSearchSchema.parse({ q: 'ape', network: 'solana', maxPrice: '2', sort: 'name_asc' })
    expect(activeFilterCount(search)).toBe(3)
    expect(clearFilters(search)).toEqual({ tab: 'all', sort: 'name_asc', page: 1 })
  })

  it('gera a consulta da API com o tamanho de página fixo', () => {
    expect(toListQuery(catalogSearchSchema.parse({ q: 'ape', page: '2' }))).toEqual({
      q: 'ape',
      collection: undefined,
      network: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      tab: 'all',
      sort: 'recent',
      page: 2,
      pageSize: 9,
    })
  })
})
