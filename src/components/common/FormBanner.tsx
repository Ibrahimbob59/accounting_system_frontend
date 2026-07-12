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
        'rounded-md border px-3 py-2 text-sm',
        variant === 'error' && 'border-danger/30 bg-danger/10 text-danger',
        variant === 'success' && 'border-success/30 bg-success/10 text-success'
      )}
    >
      {children}
    </div>
  )
}
