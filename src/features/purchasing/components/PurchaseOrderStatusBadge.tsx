import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { PurchaseOrderStatus } from '@/features/purchasing/types/purchasing.types'

const VARIANT: Record<
  PurchaseOrderStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'info',
  BILLED: 'success',
  CANCELLED: 'danger',
}

export function PurchaseOrderStatusBadge({
  status,
}: {
  status: PurchaseOrderStatus
}) {
  const { t } = useTranslation('purchasing')
  return (
    <StatusBadge variant={VARIANT[status]}>
      {t(`po.status.${status}`)}
    </StatusBadge>
  )
}
