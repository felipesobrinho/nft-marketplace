import {
  currentSessionSchema,
  type LoginRequest,
  type RegisterRequest,
  sessionResponseSchema,
} from '@/shared/contracts/auth'
import { http, request } from '@/shared/infrastructure/http'

export function login(body: LoginRequest) {
  return request(sessionResponseSchema, { url: '/auth/login', method: 'POST', data: body })
}

export function register(body: RegisterRequest) {
  return request(sessionResponseSchema, { url: '/auth/register', method: 'POST', data: body })
}

export function fetchSession(signal?: AbortSignal) {
  return request(currentSessionSchema, { url: '/auth/session', signal })
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}
