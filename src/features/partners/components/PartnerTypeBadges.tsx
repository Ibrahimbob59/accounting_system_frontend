import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'

interface PartnerTypeBadgesProps {
  isCustomer: boolean
  isSupplier: boolean
}

/** Shared between the list's Type column and the detail header. */
export function PartnerTypeBadges({ isCustomer, isSupplier }: PartnerTypeBadgesProps) {
  const { t } = useTranslation('partners')

  if (isCustomer && isSupplier) {
    return <StatusBadge variant="success">{t('list.columns.typeBoth')}</StatusBadge>
  }
  if (isCustomer) {
    return <StatusBadge variant="info">{t('list.columns.typeCustomer')}</StatusBadge>
  }
  if (isSupplier) {
    return <StatusBadge variant="warning">{t('list.columns.typeSupplier')}</StatusBadge>
  }
  return null
}
