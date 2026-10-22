import { isScenarioId, type ScenarioId } from './registry'

const STORAGE_KEY = 'kurio:mock-scenario'
const QUERY_PARAM = 'scenario'

let current: ScenarioId = 'default'
let requestCounter = 0
let catalogCounter = 0
let consumed = new Set<string>()

function storedScenario(): ScenarioId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isScenarioId(value) ? value : 'default'
  } catch {
    return 'default'
  }
}

export function initScenario(): ScenarioId {
  const fromUrl = new URLSearchParams(window.location.search).get(QUERY_PARAM)
  current = isScenarioId(fromUrl) ? fromUrl : storedScenario()
  if (isScenarioId(fromUrl)) localStorage.setItem(STORAGE_KEY, fromUrl)
  resetCounters()
  return current
}

export function getScenario(): ScenarioId {
  return current
}

export function setScenario(id: ScenarioId): void {
  current = id
  localStorage.setItem(STORAGE_KEY, id)
  resetCounters()
}

export function resetCounters(): void {
  requestCounter = 0
  catalogCounter = 0
  consumed = new Set()
}

export function consumeOnce(effect: string): boolean {
  if (consumed.has(effect)) return false
  consumed.add(effect)
  return true
}

export function nextRequestIndex(): number {
  requestCounter += 1
  return requestCounter
}

export function nextCatalogIndex(): number {
  catalogCounter += 1
  return catalogCounter
}

export function isScenario(...ids: ScenarioId[]): boolean {
  return ids.includes(current)
}
