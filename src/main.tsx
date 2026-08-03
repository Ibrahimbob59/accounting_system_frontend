import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import '@/i18n'
import App from '@/App'
import { applyTheme, getInitialTheme } from '@/app/shell/theme'
import {
  applyFeel,
  getStoredCorners,
  getStoredDensity,
} from '@/app/shell/feel'

// Set theme and feel before first paint so there's no light-to-dark flash and
// no reflow as spacing/radius tokens swap in.
applyTheme(getInitialTheme())
applyFeel(getStoredDensity(), getStoredCorners())

// TODO(backend): remove this block once the real backend is running — see
// src/mocks/README.md. Serves fake API responses so the app is usable with no
// backend; flip VITE_USE_MOCKS off in .env to go straight through to the real API.
async function enableMocksIfNeeded() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })

  const banner = document.createElement('div')
  banner.textContent = 'MOCK API — no backend connected (VITE_USE_MOCKS=true)'
  banner.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#b45309;' +
    'color:#fff;font:12px/1.6 monospace;text-align:center;padding:2px 0;pointer-events:none;'
  document.body.appendChild(banner)
}

void enableMocksIfNeeded().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
