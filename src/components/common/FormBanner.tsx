import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FormBannerProps {
  variant: 'error' | 'success'
  children: ReactNode
}

/** Inline banner above a form for API-level errors and success messages. */
export function FormBanner({ variant, children }: FormBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        // Uses the same soft-fill tokens as StatusBadge rather than an
        // opacity of the text color, so the fills survive dark mode.
        'rounded-md px-3 py-2.5 text-start text-sm',
        variant === 'error' && 'bg-danger-soft text-danger',
        variant === 'success' && 'bg-brand-soft text-brand'
      )}
    >
      {children}
    </div>
  )
}
