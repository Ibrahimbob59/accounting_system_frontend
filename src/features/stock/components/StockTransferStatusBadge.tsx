import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { StockTransferStatus } from '@/features/stock/types/stock-ops.types'

const VARIANT: Record<
  StockTransferStatus,
  'success' | 'info' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  APPROVED: 'info',
  POSTED: 'success',
  CANCELLED: 'danger',
}

export function StockTransferStatusBadge({
  status,
}: {
  status: StockTransferStatus
}) {
  const { t } = useTranslation('stockOps')
  return (
    <StatusBadge variant={VARIANT[status]}>
      {t(`transfer.status.${status}`)}
    </StatusBadge>
  )
}
