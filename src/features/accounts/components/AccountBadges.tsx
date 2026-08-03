import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/common/StatusBadge'
import type { Account } from '@/features/accounts/types/accounts.types'

/**
 * The flags worth seeing at a glance on an account row.
 *
 * Only exceptional states get a badge. "Active" is deliberately silent — it's
 * the overwhelming majority, and badging it would put a chip on all 759 rows
 * and drown out the ones that matter. Inactive is the signal.
 *
 * Control accounts are called out because they're the fixed hooks the posting
 * engine writes through (AR/AP/VAT/cash/bank) — editing or deactivating one
 * has consequences far beyond the account itself.
 */
export function AccountBadges({ account }: { account: Account }) {
  const { t } = useTranslation('accounts')

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {account.isControl && account.controlType && (
        <StatusBadge variant="info">
          {t(`controlType.${account.controlType}`)}
        </StatusBadge>
      )}
      {account.currencyRestriction && (
        <StatusBadge variant="warning">
          {account.currencyRestriction}
        </StatusBadge>
      )}
      {!account.isActive && (
        <StatusBadge variant="neutral">{t('status.inactive')}</StatusBadge>
      )}
    </span>
  )
}
