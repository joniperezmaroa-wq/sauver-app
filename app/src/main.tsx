import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App from './App'
import { initTheme } from './lib/theme'
import './index.css'

initTheme()
// App instalable y disponible sin señal; se actualiza sola al publicar una versión nueva.
if (import.meta.env.MODE !== 'demo') void import('virtual:pwa-register').then((m) => m.registerSW({ immediate: true }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
