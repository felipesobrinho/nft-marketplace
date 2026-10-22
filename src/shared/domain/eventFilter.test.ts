import { describe, expect, it } from 'vitest'
import { createEventFilter, type FilterableEvent } from './eventFilter'

const nftEvent = (eventId: string, version: number, id = 'nft-042'): FilterableEvent => ({
  eventId,
  resource: { type: 'nft', id },
  version,
})

describe('filtro de eventos', () => {
  it('aceita evento novo e descarta o mesmo eventId repetido', () => {
    const filter = createEventFilter()
    expect(filter.check(nftEvent('e1', 2))).toBe('accept')
    expect(filter.check(nftEvent('e1', 2))).toBe('duplicate')
  })

  it('descarta evento com versão menor ou igual à conhecida', () => {
    const filter = createEventFilter()
    expect(filter.check(nftEvent('e1', 3))).toBe('accept')
    expect(filter.check(nftEvent('e2', 2))).toBe('stale')
    expect(filter.check(nftEvent('e3', 3))).toBe('stale')
    expect(filter.check(nftEvent('e4', 4))).toBe('accept')
    expect(filter.knownVersion('nft', 'nft-042')).toBe(4)
  })

  it('usa a versão vista no REST como referência', () => {
    const filter = createEventFilter()
    filter.observe('nft', 'nft-042', 5)
    filter.observe('nft', 'nft-042', 3)
    expect(filter.knownVersion('nft', 'nft-042')).toBe(5)
    expect(filter.check(nftEvent('e1', 5))).toBe('stale')
    expect(filter.check(nftEvent('e2', 6))).toBe('accept')
  })

  it('controla versões por recurso', () => {
    const filter = createEventFilter()
    expect(filter.check(nftEvent('e1', 9, 'a'))).toBe('accept')
    expect(filter.check(nftEvent('e2', 1, 'b'))).toBe('accept')
  })

  it('descarta evento de outro usuário e esquece o estado ao trocar de usuário', () => {
    const filter = createEventFilter()
    filter.setUser('user-ana')
    const order = (eventId: string, userId: string): FilterableEvent => ({
      eventId,
      resource: { type: 'order', id: 'order-1' },
      version: 2,
      userId,
    })
    expect(filter.check(order('e1', 'user-bruno'))).toBe('foreign')
    expect(filter.check(order('e2', 'user-ana'))).toBe('accept')
    filter.setUser('user-bruno')
    expect(filter.knownVersion('order', 'order-1')).toBeUndefined()
    expect(filter.check(order('e3', 'user-ana'))).toBe('foreign')
  })

  it('descarta evento privado quando não há sessão', () => {
    const filter = createEventFilter()
    expect(filter.check({ ...nftEvent('e1', 1), userId: 'user-ana' })).toBe('foreign')
  })

  it('limita a memória de eventos vistos', () => {
    const filter = createEventFilter({ maxRememberedEvents: 2 })
    filter.check(nftEvent('e1', 1, 'a'))
    filter.check(nftEvent('e2', 1, 'b'))
    filter.check(nftEvent('e3', 1, 'c'))
    expect(filter.check(nftEvent('e1', 2, 'a'))).toBe('accept')
  })
})
