import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { JournalStatus } from '@/features/journal-entries/types/journal-entries.types'

/** DRAFT reads as an in-progress/neutral state, POSTED as the committed one. A
 * reversal is still POSTED — the `isReversal` flag adds a separate chip rather
 * than replacing the status, since the entry genuinely is a posted entry. */
export function JournalStatusBadge({
  status,
  isReversal,
}: {
  status: JournalStatus
  isReversal?: boolean
}) {
  const { t } = useTranslation('journalEntries')
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusBadge variant={status === 'POSTED' ? 'success' : 'neutral'}>
        {t(`status.${status}`)}
      </StatusBadge>
      {isReversal && (
        <StatusBadge variant="info">{t('status.REVERSAL')}</StatusBadge>
      )}
    </span>
  )
}
