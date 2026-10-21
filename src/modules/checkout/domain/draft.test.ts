import { describe, expect, it } from 'vitest'
import type { Buyer } from '@/shared/contracts/commerce'
import {
  attemptFor,
  type CheckoutDraft,
  emptyDraft,
  furthestStep,
  parseDraft,
  withAttempt,
  withBuyer,
  withConnection,
  withProvider,
  withStep,
  withWallet,
} from './draft'

const buyer: Buyer = {
  displayName: 'Ana Lima',
  username: 'ana.lima',
  email: 'ana@jungle.test',
  referralCode: '',
  note: '',
}

function connectedDraft(): CheckoutDraft {
  return withConnection(withProvider(withWallet(withBuyer(emptyDraft, buyer), 'wallet-1'), 'metamask'), true)
}

describe('etapas do checkout', () => {
  it('não deixa pular para a revisão sem dados e sem carteira conectada', () => {
    expect(withStep(emptyDraft, 'revisao').step).toBe('dados')
    expect(withStep(withBuyer(emptyDraft, buyer), 'revisao').step).toBe('carteira')
    expect(withStep(connectedDraft(), 'revisao').step).toBe('revisao')
  })

  it('salvar os dados leva para a etapa da carteira', () => {
    expect(withBuyer(emptyDraft, buyer).step).toBe('carteira')
  })

  it('trocar carteira ou provedor desconecta e descarta a tentativa', () => {
    const attempt = { key: 'chave-123456', quoteId: 'quote-1', sent: false }
    const draft = withStep(withAttempt(connectedDraft(), attempt), 'revisao')
    const switched = withWallet(draft, 'wallet-2')
    expect(switched.connected).toBe(false)
    expect(switched.attempt).toBeNull()
    expect(switched.step).toBe('carteira')
    expect(withProvider(draft, 'coinbase').connected).toBe(false)
    expect(withWallet(draft, 'wallet-1')).toBe(draft)
  })

  it('furthestStep reflete o que já foi preenchido', () => {
    expect(furthestStep(emptyDraft)).toBe('dados')
    expect(furthestStep(connectedDraft())).toBe('revisao')
  })
})

describe('tentativa de compra', () => {
  it('reaproveita a chave enquanto a cotação for a mesma', () => {
    let counter = 0
    const newKey = () => `chave-${String((counter += 1)).padStart(6, '0')}`
    const first = attemptFor(connectedDraft(), 'quote-1', newKey)
    const draft = withAttempt(connectedDraft(), { ...first, sent: true })
    expect(attemptFor(draft, 'quote-1', newKey)).toEqual({ ...first, sent: true })
    const renewed = attemptFor(draft, 'quote-2', newKey)
    expect(renewed.key).not.toBe(first.key)
    expect(renewed).toMatchObject({ quoteId: 'quote-2', sent: false })
  })
})

describe('parseDraft', () => {
  it('volta ao rascunho vazio quando o armazenamento está corrompido', () => {
    expect(parseDraft(null)).toEqual(emptyDraft)
    expect(parseDraft({ step: 'revisao', buyer: { email: 'x' } })).toEqual(emptyDraft)
  })

  it('corrige a etapa guardada para a mais distante permitida', () => {
    const stored = { ...withBuyer(emptyDraft, buyer), step: 'revisao' }
    expect(parseDraft(stored).step).toBe('carteira')
  })
})
