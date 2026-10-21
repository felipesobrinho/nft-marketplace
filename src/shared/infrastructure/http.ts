import axios, { type AxiosRequestConfig, isAxiosError, isCancel } from 'axios'
import type { ZodType } from 'zod'
import { apiErrorBodySchema } from '@/shared/contracts/error'
import { ApiError } from '@/shared/domain/apiError'
import { whenNetworkReady } from './networkReady'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use(async (config) => {
  await whenNetworkReady()
  return config
})

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return new ApiError({ kind: 'canceled', message: 'A operação foi cancelada.' })
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ kind: 'timeout', message: 'O servidor demorou para responder. Tente de novo.' })
    }
    if (!error.response) {
      return new ApiError({
        kind: 'network',
        message: 'Sem conexão com o servidor. Verifique sua rede e tente de novo.',
      })
    }
    const parsed = apiErrorBodySchema.safeParse(error.response.data)
    if (parsed.success) {
      const { code, message, fields, details } = parsed.data.error
      return new ApiError({
        kind: 'http',
        status: error.response.status,
        code,
        message,
        fields: fields ?? {},
        details,
      })
    }
    return new ApiError({
      kind: 'http',
      status: error.response.status,
      code: error.response.status >= 500 ? 'service_unavailable' : 'bad_request',
      message: 'Não foi possível concluir a operação.',
    })
  }
  return new ApiError({ kind: 'http', message: 'Não foi possível concluir a operação.' })
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)

export async function request<T>(schema: ZodType<T>, config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<unknown>(config)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    throw new ApiError({
      kind: 'invalid_response',
      status: response.status,
      message: 'A resposta do servidor veio em um formato inesperado.',
      details: parsed.error.issues,
    })
  }
  return parsed.data
}
