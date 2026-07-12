import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

function Wordmark({ className }: { className?: string }) {
  const { t } = useTranslation('common')
  return (
    <span className={className}>
      {/* Logo asset slot — a client's white-label mark drops in here. */}
      {t('appName')}
    </span>
  )
}

/**
 * Split-screen auth shell shared by every auth screen (§1.1). The left brand
 * panel is the one place the brand gets to breathe; it's driven entirely by
 * tokens + a logo slot, so it's where white-label branding shows up first. It
 * mirrors automatically under RTL because it uses the normal flow direction.
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation('auth')

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only. */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-sidebar px-12 text-text-on-primary lg:flex">
        <Wordmark className="text-3xl font-bold tracking-tight" />
        <p className="mt-6 max-w-sm text-center text-primary-200">
          {t('brand.tagline')}
        </p>
      </div>

      {/* Form panel. */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        {/* Mobile wordmark — brand never disappears entirely. */}
        <Wordmark className="mb-8 text-xl font-bold text-primary-900 lg:hidden" />

        <div className="w-full max-w-[400px]">
          {title && (
            <h1 className="text-2xl font-semibold text-text-primary">
              {title}
            </h1>
          )}
          {subtitle && <p className="mt-1 text-text-secondary">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
