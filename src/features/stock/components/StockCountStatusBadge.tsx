import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { StockCountStatus } from '@/features/stock/types/stock-ops.types'

export function StockCountStatusBadge({
  status,
}: {
  status: StockCountStatus
}) {
  const { t } = useTranslation('stockOps')
  const variant =
    status === 'POSTED'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : 'neutral'
  return (
    <StatusBadge variant={variant}>{t(`count.status.${status}`)}</StatusBadge>
  )
}
