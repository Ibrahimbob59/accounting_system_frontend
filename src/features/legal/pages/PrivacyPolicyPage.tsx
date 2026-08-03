import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Footer } from '@/features/landing/components/Footer'

interface PolicySection {
  title: string
  body: string
}

/**
 * Scaffold only — every section body is a placeholder pending legal review
 * (docs/CONVENTIONS.md would flag fabricated legal text as a fact this app
 * has no authority to assert). The structure and route are real; the copy
 * is not meant to ship as-is.
 */
export function PrivacyPolicyPage() {
  const { t } = useTranslation(['legal', 'common'])
  const sections = t('privacyPolicy.sections', {
    ns: 'legal',
    returnObjects: true,
  }) as PolicySection[]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-text-primary"
          >
            {t('appName', { ns: 'common' })}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-text-primary">
          {t('privacyPolicy.title', { ns: 'legal' })}
        </h1>
        <p className="mt-4 text-sm text-text-muted">
          {t('privacyPolicy.lastUpdated', { ns: 'legal' })}
        </p>

        <div className="mt-6 flex items-start gap-2 rounded-md border border-border-light bg-surface-secondary p-4 text-sm text-text-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" />
          <span>{t('privacyPolicy.draftNotice', { ns: 'legal' })}</span>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="font-display text-base font-bold text-text-primary">
                {index + 1}. {section.title}
              </h2>
              <p className="mt-2 text-text-secondary">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-center text-sm">
          <Link to="/" className="text-brand hover:underline">
            {t('notFound.backHome', { ns: 'common' })}
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
