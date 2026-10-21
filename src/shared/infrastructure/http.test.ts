import { AxiosError, AxiosHeaders, type AxiosResponse, CanceledError } from 'axios'
import { describe, expect, it } from 'vitest'
import { toApiError } from './http'

function responseError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response: AxiosResponse = { status, statusText: '', headers: {}, config, data }
  return new AxiosError('falha', 'ERR_BAD_RESPONSE', config, null, response)
}

describe('toApiError', () => {
  it('converte o envelope de erro da API', () => {
    const error = toApiError(
      responseError(422, {
        error: { code: 'validation_error', message: 'Dados inválidos', fields: { email: 'E-mail inválido' } },
      }),
    )
    expect(error.kind).toBe('http')
    expect(error.status).toBe(422)
    expect(error.code).toBe('validation_error')
    expect(error.fields).toEqual({ email: 'E-mail inválido' })
  })

  it('trata resposta fora do envelope como falha transitória quando é 5xx', () => {
    const error = toApiError(responseError(502, '<html>'))
    expect(error.code).toBe('service_unavailable')
    expect(error.isRetryable).toBe(true)
  })

  it('distingue rede, timeout e cancelamento', () => {
    expect(toApiError(new AxiosError('sem rede', 'ERR_NETWORK')).kind).toBe('network')
    expect(toApiError(new AxiosError('lento', 'ECONNABORTED')).kind).toBe('timeout')
    expect(toApiError(new CanceledError()).kind).toBe('canceled')
  })
})
