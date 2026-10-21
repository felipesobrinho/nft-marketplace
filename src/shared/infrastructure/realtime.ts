import type { Socket } from 'socket.io-client'
import {
  REALTIME_EVENT_TYPES,
  REALTIME_PATH,
  type RealtimeEvent,
  type RealtimeEventType,
  realtimeEventSchema,
} from '@/shared/contracts/events'
import { createEventFilter, type EventVerdict } from '@/shared/domain/eventFilter'
import { whenNetworkReady } from './networkReady'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

type EventOf<Type extends RealtimeEventType> = Extract<RealtimeEvent, { type: Type }>
type EventListener<Type extends RealtimeEventType> = (event: EventOf<Type>) => void

export interface RealtimeSession {
  token: string | null
  userId: string | null
}

export interface RealtimeClient {
  start(session: RealtimeSession): void
  stop(): void
  subscribe<Type extends RealtimeEventType>(type: Type, listener: EventListener<Type>): () => void
  onReconnect(listener: () => void): () => void
  onDiscard(listener: (verdict: Exclude<EventVerdict, 'accept'>, event: RealtimeEvent) => void): () => void
  observe(resourceType: 'nft' | 'order', resourceId: string, version: number): void
  getStatus(): RealtimeStatus
  subscribeStatus(listener: () => void): () => void
}

function socketUrl(): string {
  return import.meta.env.VITE_SOCKET_URL || window.location.origin
}

export function createRealtimeClient(): RealtimeClient {
  const filter = createEventFilter()
  const listeners = new Map<RealtimeEventType, Set<(event: RealtimeEvent) => void>>()
  const reconnectListeners = new Set<() => void>()
  const discardListeners = new Set<(verdict: Exclude<EventVerdict, 'accept'>, event: RealtimeEvent) => void>()
  const statusListeners = new Set<() => void>()
  let socket: Socket | null = null
  let status: RealtimeStatus = 'idle'
  let generation = 0

  const setStatus = (next: RealtimeStatus) => {
    if (next === status) return
    status = next
    statusListeners.forEach((listener) => listener())
  }

  const dispatch = (raw: unknown) => {
    const parsed = realtimeEventSchema.safeParse(raw)
    if (!parsed.success) return
    const event = parsed.data
    const verdict = filter.check(event)
    if (verdict !== 'accept') {
      discardListeners.forEach((listener) => listener(verdict, event))
      return
    }
    listeners.get(event.type)?.forEach((listener) => listener(event))
  }

  const stop = () => {
    generation += 1
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }
    setStatus('idle')
  }

  const start = (session: RealtimeSession) => {
    stop()
    filter.setUser(session.userId)
    const current = generation
    setStatus('connecting')
    void whenNetworkReady()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (current !== generation) return
        const next = io(socketUrl(), {
          path: REALTIME_PATH,
          transports: ['websocket'],
          autoConnect: false,
          auth: session.token ? { token: session.token } : {},
          reconnectionDelay: 500,
          reconnectionDelayMax: 4_000,
        })
        let connectedBefore = false
        next.on('connect', () => {
          setStatus('connected')
          if (connectedBefore) reconnectListeners.forEach((listener) => listener())
          connectedBefore = true
        })
        next.on('disconnect', () => setStatus('reconnecting'))
        for (const type of REALTIME_EVENT_TYPES) next.on(type, dispatch)
        socket = next
        next.connect()
      })
  }

  return {
    start,
    stop,
    subscribe(type, listener) {
      const set = listeners.get(type) ?? new Set()
      const wrapped = listener as (event: RealtimeEvent) => void
      set.add(wrapped)
      listeners.set(type, set)
      return () => {
        set.delete(wrapped)
      }
    },
    onReconnect(listener) {
      reconnectListeners.add(listener)
      return () => {
        reconnectListeners.delete(listener)
      }
    },
    onDiscard(listener) {
      discardListeners.add(listener)
      return () => {
        discardListeners.delete(listener)
      }
    },
    observe(resourceType, resourceId, version) {
      filter.observe(resourceType, resourceId, version)
    },
    getStatus: () => status,
    subscribeStatus(listener) {
      statusListeners.add(listener)
      return () => {
        statusListeners.delete(listener)
      }
    },
  }
}

export const realtime = createRealtimeClient()
