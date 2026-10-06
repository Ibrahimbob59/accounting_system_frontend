import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'

export interface AttentionItem {
  key: string
  label: string
  count: number | undefined
  to: string
  isLoading: boolean
}

/**
 * The "needs attention" queue — actionable backlogs (drafts to post, orders to
 * receive, …). Rows with a zero (or errored) count are hidden; when everything
 * is clear it shows a calm all-done state. Each row links to the filtered list.
 */
export function AttentionCard({ items }: { items: AttentionItem[] }) {
  const { t } = useTranslation('dashboard')
  const anyLoading = items.some((i) => i.isLoading)
  const visible = items.filter((i) => (i.count ?? 0) > 0)

  return (
    <div className="rounded-lg border border-border bg-card p-card">
      <h2 className="font-display text-base font-bold text-text-primary">
        {t('attention.title')}
      </h2>
      <p className="mt-1 text-[13px] text-text-muted">
        {t('attention.subtitle')}
      </p>

      <div className="mt-4">
        {anyLoading && visible.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-7 text-brand" />
            <p className="text-[14px] text-text-muted">
              {t('attention.allClear')}
            </p>
          </div>
        ) : (
          <ul className="-mx-1 space-y-0.5">
            {visible.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex min-w-7 items-center justify-center rounded-full bg-warning-soft px-2 py-0.5 text-[13px] font-semibold text-warning">
                      {item.count}
                    </span>
                    <span className="text-[14px] text-text-primary">
                      {item.label}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-text-muted rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
