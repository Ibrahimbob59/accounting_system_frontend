import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

/**
 * Abstract product-preview placeholder — a styled browser-chrome frame with a
 * token-driven gradient, deliberately NOT a fabricated screenshot of screens
 * that don't exist yet. Swap for a real screenshot once Phase 2+ has UI to show.
 */
function ProductPreview() {
  const { t } = useTranslation('landing')
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-secondary px-4 py-3">
        <span className="size-3 rounded-full bg-border" />
        <span className="size-3 rounded-full bg-border" />
        <span className="size-3 rounded-full bg-border" />
      </div>
      {/* Preview surface */}
      <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 sm:h-80">
        <span className="text-sm font-medium text-primary-900/70">
          {t('hero.previewCaption')}
        </span>
      </div>
    </div>
  )
}

export function Hero() {
  const { t } = useTranslation('landing')

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
        {t('hero.headline')}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
        {t('hero.subheadline')}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <a href="#demo-form">{t('hero.primaryCta')}</a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/login">{t('hero.secondaryCta')}</Link>
        </Button>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <ProductPreview />
      </div>
    </section>
  )
}
