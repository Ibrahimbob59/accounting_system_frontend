import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getInitialTheme, persistTheme } from '@/app/shell/theme'
import type { Theme } from '@/app/shell/theme'

/**
 * Sun/moon button flipping <html data-theme> between light and dark. The choice
 * persists to localStorage (same pattern as the language switcher) and defaults
 * to the OS preference on first visit — the initial apply happens in main.tsx
 * to avoid a flash, so this only handles subsequent toggles.
 */
export function ThemeToggle() {
  const { t } = useTranslation('shell')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    persistTheme(next)
  }

  const isDark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
