import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type Tone = 'default' | 'positive' | 'negative'

interface KpiCardProps {
  label: string
  /** Pre-formatted value (e.g. money). */
  value: string | undefined
  hint?: string
  icon: LucideIcon
  tone?: Tone
  isLoading?: boolean
  isError?: boolean
}

const TONE: Record<Tone, string> = {
  default: 'text-text-primary',
  positive: 'text-brand',
  negative: 'text-danger',
}

/**
 * A headline financial metric — larger than the plain count StatCard, with a
 * formatted money value, an optional hint line, and a semantic tone for the
 * figure (profit green / loss red). Degrades to "—" on error so one blocked
 * report never breaks the row.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  isLoading,
  isError,
}: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <span className="icon-chip">
          <Icon className="size-4" />
        </span>
      </div>
      <div
        className={cn(
          'mt-4 font-display text-[length:var(--stat-size)] font-bold',
          TONE[tone]
        )}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="inline-block h-8 w-28 animate-pulse rounded bg-surface-secondary"
          />
        ) : isError || value === undefined ? (
          <span className="text-text-disabled">—</span>
        ) : (
          value
        )}
      </div>
      {hint && !isLoading && (
        <p className="mt-1 text-[13px] text-text-muted">{hint}</p>
      )}
    </div>
  )
}
