import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

export function LandingNav() {
  const { t } = useTranslation(['landing', 'common'])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo asset slot — white-label swap point, same as the auth brand panel. */}
        <span className="text-xl font-bold tracking-tight text-primary-900">
          {t('appName', { ns: 'common' })}
        </span>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" asChild>
            <Link to="/login">{t('nav.login')}</Link>
          </Button>
          <Button asChild>
            <a href="#demo-form">{t('nav.requestDemo')}</a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
