import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { TrialBalanceTable } from '@/features/reports/components/TrialBalanceTable'
import { useTrialBalance } from '@/features/reports/hooks/useTrialBalance'
import type { TrialBalanceQuery } from '@/features/reports/types/reports.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

// Sentinel for the "no conversion" choice — distinct from `null` (which means
// "not chosen yet", so the report defaults to the company base currency).
const NO_CONVERSION = '__none__'

export function TrialBalancePage() {
  const { t } = useTranslation('reports')
  const companyBase = useActiveCompanyBaseCurrency()
  const currencies = useCurrencies()

  const [asOf, setAsOf] = useState('')
  const [prefixInput, setPrefixInput] = useState('')
  const [rollUp, setRollUp] = useState(false)
  const [presentChoice, setPresentChoice] = useState<string | null>(null)

  const debouncedPrefix = useDebouncedValue(prefixInput)

  // null → default to the company base so a mixed scope reads as one balancing
  // report; the sentinel → send nothing and show the native per-currency view.
  const presentIn =
    presentChoice === NO_CONVERSION ? undefined : (presentChoice ?? companyBase)

  const numberPrefix = useMemo(
    () =>
      debouncedPrefix
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [debouncedPrefix]
  )

  const query: TrialBalanceQuery = useMemo(
    () => ({
      asOf: asOf || undefined,
      numberPrefix: numberPrefix.length ? numberPrefix : undefined,
      rollUp: rollUp || undefined,
      presentIn,
    }),
    [asOf, numberPrefix, rollUp, presentIn]
  )

  const report = useTrialBalance(query)
  const data = report.data

  const selectValue = presentChoice ?? companyBase ?? NO_CONVERSION

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('trialBalance.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('trialBalance.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-[180px]">
          <Label htmlFor="tb-as-of" className="field-label">
            {t('filters.asOf')}
          </Label>
          <div className="field-box">
            <Input
              id="tb-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full space-y-2 sm:w-[200px]">
          <Label htmlFor="tb-prefix" className="field-label">
            {t('filters.numberPrefix')}
          </Label>
          <div className="field-box">
            <Input
              id="tb-prefix"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              placeholder={t('filters.numberPrefixPlaceholder')}
            />
          </div>
        </div>

        <SelectField
          className="w-[180px]"
          id="tb-present-in"
          label={t('filters.presentIn')}
          value={selectValue}
          onChange={(e) => setPresentChoice(e.target.value)}
          options={[
            { value: NO_CONVERSION, label: t('filters.presentNone') },
            ...(currencies.data ?? [])
              .filter((c) => c.isActive)
              .map((c) => ({ value: c.code, label: c.code })),
          ]}
        />

        <div className="pb-2">
          <CheckboxField
            id="tb-roll-up"
            label={t('filters.rollUp')}
            checked={rollUp}
            onCheckedChange={(v) => setRollUp(v === true)}
          />
        </div>
      </div>

      {report.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : report.isError ? (
        <p className="py-8 text-center text-text-muted">
          {isPermissionDenied(report.error)
            ? t('errors.permissionDeniedSection')
            : t('errors.generic')}
        </p>
      ) : data ? (
        <div className="space-y-6">
          {data.presentation && <PresentationNote data={data} />}

          {data.byBaseCurrency && data.byBaseCurrency.length > 0 ? (
            // Mixed base currency: one balanced trial balance per currency, never
            // summed across them.
            <div className="space-y-8">
              {data.byBaseCurrency.map((group) => (
                <TrialBalanceTable
                  key={group.currency}
                  rows={group.rows}
                  currency={group.currency}
                  totalDebit={group.totalDebit}
                  totalCredit={group.totalCredit}
                  isBalanced={group.isBalanced}
                  rolledUp={data.rolledUp}
                />
              ))}
            </div>
          ) : (
            <TrialBalanceTable
              rows={data.rows}
              currency={data.currency ?? ''}
              totalDebit={data.totalDebit ?? 0}
              totalCredit={data.totalCredit ?? 0}
              isBalanced={data.isBalanced}
              rolledUp={data.rolledUp}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

/** The banner above the report explaining the ?presentIn conversion — either
 *  that everything is shown converted (with the rate), or that a rate was
 *  missing so it fell back to the native per-currency breakdown. */
function PresentationNote({
  data,
}: {
  data: NonNullable<ReturnType<typeof useTrialBalance>['data']>
}) {
  const { t } = useTranslation('reports')
  const presentation = data.presentation!
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
