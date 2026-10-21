import { holdNetworkUntil } from '@/shared/infrastructure/networkReady'

export function bootstrapMocks(): void {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const ready = import('@/mocks/browser').then(({ startMocks }) => startMocks())
  holdNetworkUntil(ready)
  void ready.then(() => import('@/mocks/control/panel/mount')).then(({ mountDemoPanel }) => mountDemoPanel())
}
