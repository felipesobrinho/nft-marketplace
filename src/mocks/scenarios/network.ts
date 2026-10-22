import { delay, HttpResponse } from 'msw'
import { getScenario, nextCatalogIndex, nextRequestIndex } from './state'

export type RequestKind = 'api' | 'catalog'

function seededRandom(index: number): number {
  let value = (index * 0x6d2b79f5) >>> 0
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
}

export function latencyFor(kind: RequestKind): number {
  const index = nextRequestIndex()
  switch (getScenario()) {
    case 'slow':
      return 2_500
    case 'variable-latency':
      return 200 + Math.floor(seededRandom(index) * 1_600)
    case 'out-of-order':
      if (kind === 'catalog') return nextCatalogIndex() % 2 === 1 ? 1_500 : 200
      return 80 + Math.floor(seededRandom(index) * 220)
    default:
      return 80 + Math.floor(seededRandom(index) * 220)
  }
}

export async function simulateNetwork(kind: RequestKind): Promise<Response | null> {
  if (getScenario() === 'offline') return HttpResponse.error()
  await delay(latencyFor(kind))
  return null
}
