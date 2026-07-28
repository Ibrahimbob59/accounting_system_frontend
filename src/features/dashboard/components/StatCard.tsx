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
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-md bg-primary-100 text-primary-900">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-text-primary">
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
