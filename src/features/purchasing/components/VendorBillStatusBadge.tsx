import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { VendorBillStatus } from '@/features/purchasing/types/purchasing.types'

export function VendorBillStatusBadge({
  status,
}: {
  status: VendorBillStatus
}) {
  const { t } = useTranslation('purchasing')
  const variant =
    status === 'POSTED'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : 'neutral'
  return (
    <StatusBadge variant={variant}>{t(`bill.status.${status}`)}</StatusBadge>
  )
}
