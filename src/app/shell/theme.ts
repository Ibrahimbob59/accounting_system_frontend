export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/** The persisted choice, if any and valid. */
export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

/** Persisted choice, else the OS preference, else light. */
export function getInitialTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** Reflect the theme on <html data-theme> — the attribute tokens.css keys off. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

/** Persist and apply in one call. */
export function persistTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}
