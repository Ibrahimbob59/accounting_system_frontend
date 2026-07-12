import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { LandingNav } from '@/features/landing/components/LandingNav'
import { Hero } from '@/features/landing/components/Hero'
import { FeatureGrid } from '@/features/landing/components/FeatureGrid'
import { WhySwitch } from '@/features/landing/components/WhySwitch'
import { Footer } from '@/features/landing/components/Footer'
import { DemoRequestForm } from '@/features/leads/components/DemoRequestForm'

/**
 * Public marketing landing page (`/`). Its own layout — not the split-screen
 * AuthLayout. The demo-request form is embedded as the `#demo-form` section
 * rather than living on its own route.
 */
export function LandingPage() {
  const { t } = useTranslation('landing')
  const location = useLocation()

  // Scroll to a hash target (e.g. arriving from the Login screen's
  // "Request a demo" link at /#demo-form).
  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [location])

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <Hero />
        <FeatureGrid />
        <WhySwitch />

        <section id="demo-form" className="scroll-mt-16">
          <div className="mx-auto max-w-2xl px-6 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                {t('demo.heading')}
              </h2>
              <p className="mt-3 text-text-secondary">{t('demo.subheading')}</p>
            </div>
            <div className="mt-10">
              <DemoRequestForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
