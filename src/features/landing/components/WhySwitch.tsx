import { useTranslation } from 'react-i18next'

export function WhySwitch() {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {t('whySwitch.heading')}
        </p>
        <p className="font-display mt-6 text-2xl leading-relaxed text-text-primary sm:text-3xl">
          {t('whySwitch.body')}
        </p>
      </div>
    </section>
  )
}
