import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/styles/globals.css'
import '@/i18n'
import App from '@/App'
import { applyTheme, getInitialTheme } from '@/app/shell/theme'

// Set the theme before first paint so there's no light-to-dark flash.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
