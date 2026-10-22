import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/domain/apiError'
import { retryDelay, shouldRetry } from './queryClient'

describe('política de retry', () => {
  const transient = new ApiError({ kind: 'http', status: 503, message: '' })
  const conflict = new ApiError({ kind: 'http', status: 409, message: '' })

  it('repete no máximo duas vezes falhas transitórias', () => {
    expect(shouldRetry(0, transient)).toBe(true)
    expect(shouldRetry(1, transient)).toBe(true)
    expect(shouldRetry(2, transient)).toBe(false)
  })

  it('nunca repete 4xx nem erro desconhecido', () => {
    expect(shouldRetry(0, conflict)).toBe(false)
    expect(shouldRetry(0, new Error('x'))).toBe(false)
  })

  it('espera de forma exponencial até 4 segundos', () => {
    expect([0, 1, 2, 3, 4].map(retryDelay)).toEqual([500, 1000, 2000, 4000, 4000])
  })
})
