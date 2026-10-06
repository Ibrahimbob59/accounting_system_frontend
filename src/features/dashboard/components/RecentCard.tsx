import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

/**
 * A recent-activity card: a titled panel with a "view all" link and a compact
 * list body (loading / empty / rows handled here, rows supplied by the caller).
 */
export function RecentCard({
  title,
  viewAllTo,
  isLoading,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string
  viewAllTo: string
  isLoading: boolean
  isEmpty: boolean
  emptyLabel: string
  children: ReactNode
}) {
  const { t } = useTranslation('dashboard')
  return (
    <div className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-text-primary">
          {title}
        </h2>
        <Link
          to={viewAllTo}
          className="text-[13px] font-medium text-brand hover:underline"
        >
          {t('recent.viewAll')}
        </Link>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : isEmpty ? (
          <p className="py-8 text-center text-[14px] text-text-muted">
            {emptyLabel}
          </p>
        ) : (
          <ul className="divide-y divide-border">{children}</ul>
        )}
      </div>
    </div>
  )
}

/** One compact row: a leading label + sublabel, a trailing amount + meta. */
export function RecentRow({
  to,
  title,
  subtitle,
  amount,
  meta,
}: {
  to: string
  title: string
  subtitle: string
  amount: string
  meta?: ReactNode
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-brand"
      >
        <span className="min-w-0">
          <span className="block truncate font-mono text-[13px] text-text-primary">
            {title}
          </span>
          <span className="block truncate text-[12px] text-text-muted">
            {subtitle}
          </span>
        </span>
        <span className="shrink-0 text-end">
          <span className="block font-mono text-[13px] text-text-primary">
            {amount}
          </span>
          {meta && <span className="block text-[12px]">{meta}</span>}
        </span>
      </Link>
    </li>
  )
}
