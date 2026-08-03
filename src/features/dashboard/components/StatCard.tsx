import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | undefined
  isLoading: boolean
  isError: boolean
  icon: LucideIcon
}

/**
 * A single dashboard metric. Three display states: a pulse while its query
 * resolves, a quiet "—" if the endpoint errors (e.g. 403 for a role that can't
 * read the resource) so one restricted card never breaks the page, else the
 * value.
 */
export function StatCard({
  label,
  value,
  isLoading,
  isError,
  icon: Icon,
}: StatCardProps) {
  return (
    // Flat: 1px border on --surface, no shadow (handoff §5). Padding is the
    // density token, so compact mode retunes every card at once.
    <div className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <span className="icon-chip">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-4 font-display text-[length:var(--stat-size)] font-bold text-text-primary">
        {isLoading ? (
          <span
            aria-hidden="true"
            className="inline-block h-8 w-20 animate-pulse rounded bg-surface-secondary"
          />
        ) : isError || value === undefined ? (
          <span className="text-text-disabled">—</span>
        ) : (
          value.toLocaleString()
        )}
      </div>
    </div>
  )
}
