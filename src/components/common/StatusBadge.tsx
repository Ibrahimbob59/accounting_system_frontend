import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Handoff §5 — Badges/Pills. Always fully round (the corner-mode toggle
 * deliberately does NOT apply here), 12px/600, and borderless: the soft fill
 * alone carries the semantics, so a row of badges reads as tinted labels
 * rather than as a row of small outlined boxes.
 *
 * Each variant pairs a `-soft` fill token with its text token; neither is an
 * opacity of the other, so the pairs stay legible in dark mode where a `/10`
 * fill over a dark surface would all but vanish.
 */
const statusBadgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        /* Success reuses the brand accent — the handoff has no second green. */
        success: 'bg-brand-soft text-brand',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
        neutral: 'bg-neutral-badge text-neutral-badge-text',
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
