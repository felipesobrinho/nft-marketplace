import type { ApiErrorCode } from '@/shared/contracts/error'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'invalid_response'

export interface ApiErrorInit {
  kind: ApiErrorKind
  message: string
  status?: number | null
  code?: ApiErrorCode | null
  fields?: Record<string, string>
  details?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: ApiErrorCode | null
  readonly fields: Record<string, string>
  readonly details: unknown

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status ?? null
    this.code = init.code ?? null
    this.fields = init.fields ?? {}
    this.details = init.details
  }

  get isRetryable(): boolean {
    if (this.kind === 'network' || this.kind === 'timeout') return true
    return this.kind === 'http' && this.status !== null && this.status >= 500
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  is(code: ApiErrorCode): boolean {
    return this.code === code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

const fallbackMessages: Record<ApiErrorKind, string> = {
  http: 'Não foi possível concluir a operação.',
  network: 'Sem conexão com o servidor. Verifique sua rede e tente de novo.',
  timeout: 'O servidor demorou para responder. Tente de novo.',
  canceled: 'A operação foi cancelada.',
  invalid_response: 'A resposta do servidor veio em um formato inesperado.',
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message || fallbackMessages[error.kind]
  return fallbackMessages.http
}
