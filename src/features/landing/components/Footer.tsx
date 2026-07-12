import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation(['landing', 'common', 'legal'])
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
        <span className="font-display text-lg font-semibold tracking-tight text-primary-900">
          {t('appName', { ns: 'common' })}
        </span>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <Link
            to="/privacy-policy"
            className="text-sm text-text-muted hover:text-text-secondary hover:underline"
          >
            {t('privacyPolicy.title', { ns: 'legal' })}
          </Link>
          <p className="text-sm text-text-muted">
            {t('footer.copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  )
}
