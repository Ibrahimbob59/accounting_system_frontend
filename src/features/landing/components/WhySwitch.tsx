import { useTranslation } from 'react-i18next'

export function WhySwitch() {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-surface-secondary">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          {t('whySwitch.heading')}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          {t('whySwitch.body')}
        </p>
      </div>
    </section>
  )
}
