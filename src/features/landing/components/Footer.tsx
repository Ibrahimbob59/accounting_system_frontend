import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation(['landing', 'common'])
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
        <span className="font-display text-lg font-semibold tracking-tight text-primary-900">
          {t('appName', { ns: 'common' })}
        </span>
        <p className="text-sm text-text-muted">
          {t('footer.copyright', { year })}
        </p>
      </div>
    </footer>
  )
}
