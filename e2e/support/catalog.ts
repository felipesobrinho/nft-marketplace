import { expect, type Locator, type Page } from '@playwright/test'
import { call } from './mock'

export function catalog(page: Page): Locator {
  return page.locator('#catalogo')
}

export function cards(page: Page): Locator {
  return catalog(page).getByRole('article')
}

export function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 768
}

export async function filters(page: Page): Promise<Locator> {
  if (isMobile(page)) {
    await page.getByRole('button', { name: 'Filtros' }).click()
    return page.getByRole('dialog', { name: 'Filtros' })
  }
  return catalog(page)
}

export async function closeFilters(page: Page): Promise<void> {
  if (isMobile(page)) await page.getByRole('button', { name: 'Ver resultados' }).click()
}

export async function pick(page: Page, name: RegExp | string): Promise<void> {
  const panel = await filters(page)
  await panel.getByRole('button', { name }).click()
  await closeFilters(page)
}

export async function expectSearch(page: Page, expected: Record<string, string | null>): Promise<void> {
  await expect
    .poll(() => {
      const params = new URL(page.url()).searchParams
      return Object.fromEntries(Object.keys(expected).map((key) => [key, params.get(key)]))
    })
    .toEqual(expected)
}

export async function apiTotal(page: Page, query: string): Promise<number> {
  return (await call<{ total: number }>(page, `/api/nfts?${query}`)).body.total
}
