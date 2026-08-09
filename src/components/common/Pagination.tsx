import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Prev/next pager with a "Page X of Y (N total)" summary, driven by the
 * backend's pagination meta. Renders nothing when there's a single page, so
 * callers can drop it in unconditionally. Labels come from the `common`
 * namespace, so every list reads the same rather than each re-translating.
 */
export function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const { t } = useTranslation('common')
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm text-text-secondary">
      <span>{t('pagination.summary', { page, totalPages, total })}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {t('pagination.prev')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          {t('pagination.next')}
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
