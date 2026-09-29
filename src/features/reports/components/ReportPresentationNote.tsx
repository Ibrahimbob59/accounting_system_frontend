import { useTranslation } from 'react-i18next'

import type { ReportPresentation } from '@/features/reports/types/reports.types'

/** The banner above a currency-aware report explaining the ?presentIn
 *  conversion — either everything shown converted (with the rate), or a rate was
 *  missing so it fell back to the native per-currency breakdown. Shared by the
 *  VAT return, general ledger, income statement and balance sheet pages. */
export function ReportPresentationNote({
  presentation,
}: {
  presentation: ReportPresentation
}) {
  const { t } = useTranslation('reports')
  const rate = presentation.rates[0]

  if (presentation.converted) {
    return (
      <p className="rounded-lg bg-surface-secondary px-4 py-3 text-[13px] text-text-secondary">
        {presentation.rates.length > 1
          ? t('presentation.convertedMulti', {
              currency: presentation.currency,
            })
          : t('presentation.converted', {
              currency: presentation.currency,
              rateType: rate?.rateType ?? '',
              date: rate?.rateDate ?? '',
            })}
      </p>
    )
  }

  return (
    <p className="rounded-lg bg-warning-soft px-4 py-3 text-[13px] text-warning">
      {t('presentation.mixedNoRate', { currency: presentation.currency })}
    </p>
  )
}
