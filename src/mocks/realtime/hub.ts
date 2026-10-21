import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { REALTIME_PATH, type RealtimeEvent } from '@/shared/contracts/events'

const PING_INTERVAL_MS = 20_000
const CONNECT_PACKET = '40'
const PING_PACKET = '2'

interface Connection {
  id: string
  userId: string | null
  emit: (event: RealtimeEvent) => void
  close: () => void
}

export type ResolveUser = (token: string | undefined) => string | null

const connections = new Map<string, Connection>()
const MAX_LOG = 50
const log: RealtimeEvent[] = []

export const realtimeLink = ws.link(new RegExp(`${REALTIME_PATH}$`))

function readToken(raw: string): string | undefined {
  const payload = raw.slice(CONNECT_PACKET.length)
  if (!payload) return undefined
  try {
    const auth: unknown = JSON.parse(payload)
    if (auth && typeof auth === 'object' && 'token' in auth && typeof auth.token === 'string') {
      return auth.token
    }
  } catch {
    return undefined
  }
  return undefined
}

export function createRealtimeHandler(options: {
  resolveUser: ResolveUser
  acceptConnections: () => boolean
}) {
  return realtimeLink.addEventListener('connection', (connection) => {
    const { client } = connection
    if (!options.acceptConnections()) {
      client.close(1013, 'indisponivel')
      return
    }
    const socket = toSocketIo(connection)
    const entry: Connection = {
      id: client.id,
      userId: null,
      emit: (event) => socket.client.emit(event.type, event),
      close: () => client.close(),
    }
    connections.set(entry.id, entry)

    const ping = setInterval(() => client.send(PING_PACKET), PING_INTERVAL_MS)

    client.addEventListener('message', (message) => {
      if (typeof message.data !== 'string' || !message.data.startsWith(CONNECT_PACKET)) return
      entry.userId = options.resolveUser(readToken(message.data))
    })

    client.addEventListener('close', () => {
      clearInterval(ping)
      connections.delete(entry.id)
    })
  })
}

export function publish(event: RealtimeEvent): number {
  log.push(event)
  if (log.length > MAX_LOG) log.shift()
  return deliver(event)
}

export function deliver(event: RealtimeEvent): number {
  let delivered = 0
  for (const connection of connections.values()) {
    if (event.userId !== undefined && event.userId !== connection.userId) continue
    connection.emit(event)
    delivered += 1
  }
  return delivered
}

export function disconnectAll(): number {
  const all = [...connections.values()]
  all.forEach((connection) => connection.close())
  return all.length
}

export function connectionCount(): number {
  return connections.size
}

export function lastEvent(
  predicate: (event: RealtimeEvent) => boolean = () => true,
): RealtimeEvent | undefined {
  return [...log].reverse().find(predicate)
}

export function clearEventLog(): void {
  log.length = 0
}
