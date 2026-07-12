import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        danger: 'border-danger/30 bg-danger/10 text-danger',
        info: 'border-info/30 bg-info/10 text-info',
        neutral: 'border-border bg-surface-secondary text-text-secondary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export interface StatusBadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof statusBadgeVariants> {}

/**
 * Semantic-color status chip — draft/confirmed/paid/void, roles, etc. Kept
 * separate from shadcn's own Badge (components/ui/badge.tsx, vendor code)
 * rather than adding these variants to its cva config directly, so that
 * file stays a clean, regeneratable shadcn primitive — same
 * ui/ vs common/ boundary as every other component here.
 */
export function StatusBadge({
  className,
  variant,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  )
}
