import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { bootstrapMocks } from './bootstrap'

bootstrapMocks()

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root ausente em index.html')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
