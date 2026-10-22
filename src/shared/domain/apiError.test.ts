import { describe, expect, it } from 'vitest'
import { ApiError, errorMessage } from './apiError'

describe('ApiError', () => {
  it('repete só falha de rede, timeout e 5xx', () => {
    expect(new ApiError({ kind: 'network', message: '' }).isRetryable).toBe(true)
    expect(new ApiError({ kind: 'timeout', message: '' }).isRetryable).toBe(true)
    expect(new ApiError({ kind: 'http', status: 503, message: '' }).isRetryable).toBe(true)
    expect(new ApiError({ kind: 'http', status: 409, message: '' }).isRetryable).toBe(false)
    expect(new ApiError({ kind: 'http', status: 401, message: '' }).isRetryable).toBe(false)
    expect(new ApiError({ kind: 'canceled', message: '' }).isRetryable).toBe(false)
  })

  it('identifica o código do envelope de erro', () => {
    const error = new ApiError({ kind: 'http', status: 409, code: 'out_of_stock', message: 'Esgotado' })
    expect(error.is('out_of_stock')).toBe(true)
    expect(error.is('price_changed')).toBe(false)
  })

  it('usa a mensagem do servidor ou uma mensagem padrão', () => {
    expect(errorMessage(new ApiError({ kind: 'http', message: 'Cupom expirado' }))).toBe('Cupom expirado')
    expect(errorMessage(new ApiError({ kind: 'network', message: '' }))).toMatch(/Sem conexão/)
    expect(errorMessage(new Error('x'))).toMatch(/Não foi possível/)
  })
})
