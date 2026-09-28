import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { PaymentStatus } from '@/features/payments/types/payments.types'

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation('payments')
  const variant = status === 'POSTED' ? 'success' : 'danger'
  return <StatusBadge variant={variant}>{t(`status.${status}`)}</StatusBadge>
}
