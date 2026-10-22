export interface FilterableEvent {
  eventId: string
  resource: { type: string; id: string }
  version: number
  userId?: string | undefined
}

export type EventVerdict = 'accept' | 'duplicate' | 'stale' | 'foreign'

export interface EventFilter {
  check(event: FilterableEvent): EventVerdict
  observe(resourceType: string, resourceId: string, version: number): void
  knownVersion(resourceType: string, resourceId: string): number | undefined
  setUser(userId: string | null): void
  reset(): void
}

const resourceKey = (type: string, id: string) => `${type}:${id}`

export function createEventFilter(options: { maxRememberedEvents?: number } = {}): EventFilter {
  const maxRemembered = options.maxRememberedEvents ?? 500
  let seen = new Set<string>()
  let versions = new Map<string, number>()
  let currentUser: string | null = null

  const remember = (eventId: string) => {
    seen.add(eventId)
    if (seen.size > maxRemembered) {
      const oldest = seen.values().next().value
      if (oldest !== undefined) seen.delete(oldest)
    }
  }

  const observe = (type: string, id: string, version: number) => {
    const key = resourceKey(type, id)
    const known = versions.get(key)
    if (known === undefined || version > known) versions.set(key, version)
  }

  return {
    check(event) {
      if (seen.has(event.eventId)) return 'duplicate'
      if (event.userId !== undefined && event.userId !== currentUser) return 'foreign'
      const known = versions.get(resourceKey(event.resource.type, event.resource.id))
      if (known !== undefined && event.version <= known) {
        remember(event.eventId)
        return 'stale'
      }
      remember(event.eventId)
      observe(event.resource.type, event.resource.id, event.version)
      return 'accept'
    },
    observe,
    knownVersion(type, id) {
      return versions.get(resourceKey(type, id))
    },
    setUser(userId) {
      if (userId === currentUser) return
      currentUser = userId
      seen = new Set()
      versions = new Map()
    },
    reset() {
      seen = new Set()
      versions = new Map()
      currentUser = null
    },
  }
}
