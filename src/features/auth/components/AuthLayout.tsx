import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  /** Register's two-column company/account sections need more room (520px)
   * than a single-column Login/Forgot form (400px). */
  wide?: boolean
}

/**
 * Auth shell (handoff §4). A single column centered in the viewport — no
 * split-screen brand panel, no card, no logo. That absence is the design
 * decision, not an omission: the handoff calls for auth screens to stay
 * minimal, so the form sits directly on the page background with nothing
 * competing for attention.
 *
 * Alignment differs by form shape, which is why `wide` exists as a shape flag
 * rather than a width override: narrow forms (Login, Forgot) are center-
 * aligned throughout, while the wide Register form left-aligns its labels —
 * centered labels over a two-column grid would be unreadable.
 */
export function AuthLayout({ children, title, subtitle, wide }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-page">
      <div
        className={cn(
          'w-full',
          wide ? 'max-w-[520px]' : 'max-w-[400px] text-center'
        )}
      >
        {title && (
          <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-2 text-[15px] text-text-muted">{subtitle}</p>
        )}
        <div className="mt-[length:var(--form-top)]">{children}</div>
      </div>
    </div>
  )
}
