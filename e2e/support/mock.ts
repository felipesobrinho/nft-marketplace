import { expect, type Page } from '@playwright/test'

export interface ApiResult<T = unknown> {
  status: number
  body: T
}

export interface CallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function callOnce<T>(page: Page, path: string, options: CallOptions = {}): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ path, options }) => {
      const response = await fetch(path, {
        method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
        headers: { 'content-type': 'application/json', ...options.headers },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
      const text = await response.text()
      return { status: response.status, body: (text ? JSON.parse(text) : null) as T }
    },
    { path, options },
  )
}

export async function waitForMocks(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const response = await fetch('/__mock/realtime')
          return response.headers.get('content-type')?.includes('application/json') ?? false
        }),
      { timeout: 15_000 },
    )
    .toBe(true)
}

export async function waitForSocket(page: Page): Promise<void> {
  await expect
    .poll(async () => (await call<{ connections: number }>(page, '/__mock/realtime')).body.connections)
    .toBeGreaterThan(0)
}

export async function resetMocks(page: Page, scenario = 'default'): Promise<void> {
  await page.goto('/')
  await waitForMocks(page)
  await call(page, '/__mock/reset', { body: { scenario } })
  await page.reload()
  await waitForMocks(page)
}

export async function setScenario(page: Page, id: string): Promise<void> {
  await waitForMocks(page)
  const result = await call(page, '/__mock/scenario', { method: 'PUT', body: { id } })
  expect(result.status).toBe(200)
}

export async function login(page: Page, email = 'ana@jungle.test', password = 'Senha@123'): Promise<string> {
  const result = await call<{ token: string }>(page, '/api/auth/login', { body: { email, password } })
  expect(result.status).toBe(200)
  return result.body.token
}

export const auth = (token: string) => ({ authorization: `Bearer ${token}` })

export async function call<T = unknown>(
  page: Page,
  path: string,
  options: CallOptions = {},
): Promise<ApiResult<T>> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await callOnce<T>(page, path, options)
    } catch (error) {
      const transient = error instanceof Error && error.message.includes('Failed to fetch')
      if (!transient || attempt >= 3) throw error
      await waitForMocks(page)
    }
  }
}
