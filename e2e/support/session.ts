import type { Page } from '@playwright/test'
import { call, waitForMocks } from './mock'

export const ana = { email: 'ana@jungle.test', password: 'Senha@123', name: 'Ana Lima' }
export const bruno = { email: 'bruno@jungle.test', password: 'Senha@123', name: 'Bruno Costa' }

export async function signInThroughApi(
  page: Page,
  user: { email: string; password: string } = ana,
): Promise<void> {
  const result = await call<{ token: string; expiresAt: string; user: { id: string } }>(
    page,
    '/api/auth/login',
    {
      body: { email: user.email, password: user.password },
    },
  )
  if (result.status !== 200) throw new Error(`login falhou: ${result.status}`)
  await page.evaluate(
    (session) => {
      localStorage.setItem('kurio:session', JSON.stringify(session))
    },
    { token: result.body.token, expiresAt: result.body.expiresAt, userId: result.body.user.id },
  )
  await page.reload()
  await waitForMocks(page)
}
