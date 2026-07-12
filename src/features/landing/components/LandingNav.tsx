import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

export function LandingNav() {
  const { t } = useTranslation(['landing', 'common'])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        {/* Logo asset slot — white-label swap point, same as the auth brand panel. */}
        <span className="font-display shrink-0 text-lg font-semibold tracking-tight text-primary-900 sm:text-xl">
          {t('appName', { ns: 'common' })}
        </span>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          {/* Hidden below sm — Hero repeats a Log in CTA, so nothing is lost,
              and this is the first thing to give up the fight for nav width. */}
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/login">{t('nav.login')}</Link>
          </Button>
          <Button size="sm" className="sm:h-10 sm:px-4" asChild>
            <a href="#demo-form">{t('nav.requestDemo')}</a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
