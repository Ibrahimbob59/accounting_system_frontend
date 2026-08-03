import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { SUPPORTED_LANGUAGES } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Language selector shown by native name (English / Français / العربية),
 * regardless of the active language. Lives in components/common so it's a
 * one-line drop-in for AuthLayout and the Phase 2 app shell later — not a
 * one-off. Selecting a language calls i18n.changeLanguage, which already
 * triggers the <html dir> RTL sync (Phase 0 §0.10) and persists the choice
 * via the language detector's localStorage cache.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation('common')
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage)?.code ??
    'en'

  return (
    <div className={cn('relative', className)}>
      <select
        aria-label={t('language')}
        value={current}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className="h-9 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface py-0 ps-2 pe-7 text-sm text-text-secondary hover:text-text-primary"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute inset-y-0 end-2 my-auto size-3.5 text-text-muted" />
    </div>
  )
}
