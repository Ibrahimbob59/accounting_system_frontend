import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { SalesInvoiceStatus } from '@/features/invoicing/types/invoicing.types'

/** Shared status chip for sales invoices and credit notes (same enum). */
export function InvoiceStatusBadge({ status }: { status: SalesInvoiceStatus }) {
  const { t } = useTranslation('invoicing')
  const variant =
    status === 'POSTED'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : 'neutral'
  return <StatusBadge variant={variant}>{t(`status.${status}`)}</StatusBadge>
}
