import { createRoot } from 'react-dom/client'
import { DemoPanel } from './DemoPanel'

export function mountDemoPanel(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('painel-demo')) return

  const container = document.createElement('div')
  container.id = 'painel-demo'
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(<DemoPanel />)
}
