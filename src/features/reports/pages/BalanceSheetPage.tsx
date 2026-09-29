import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { StatusBadge } from '@/components/common/StatusBadge'
import { StatementSection } from '@/features/reports/components/StatementSection'
import { ReportPresentationNote } from '@/features/reports/components/ReportPresentationNote'
import { useBalanceSheet } from '@/features/reports/hooks/useStatements'
import type {
  BalanceSheetCurrencyGroup,
  BalanceSheetQuery,
} from '@/features/reports/types/reports.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

const NO_CONVERSION = '__none__'
const today = () => new Date().toISOString().slice(0, 10)

export function BalanceSheetPage() {
  const { t, i18n } = useTranslation('reports')
  const lang = i18n.language
  const companyBase = useActiveCompanyBaseCurrency()
  const currencies = useCurrencies()
  const lookupCurrency = useCurrencyLookup()

  const [asOf, setAsOf] = useState(today())
  const [rollUp, setRollUp] = useState(false)
  const [presentChoice, setPresentChoice] = useState<string | null>(null)

  const presentIn =
    presentChoice === NO_CONVERSION ? undefined : (presentChoice ?? companyBase)

  const query: BalanceSheetQuery = useMemo(
    () => ({ asOf: asOf || undefined, rollUp: rollUp || undefined, presentIn }),
    [asOf, rollUp, presentIn]
  )
  const report = useBalanceSheet(query)
  const data = report.data
  const selectValue = presentChoice ?? companyBase ?? NO_CONVERSION

  const money = (currency: string) => (n: number) =>
    formatMoney(n, lookupCurrency(currency), lang)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('balanceSheet.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('balanceSheet.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-[180px]">
          <Label htmlFor="bs-as-of" className="field-label">
            {t('filters.asOf')}
          </Label>
          <div className="field-box">
            <Input
              id="bs-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
        </div>
        <SelectField
          className="w-[160px]"
          id="bs-present-in"
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
            id="bs-roll-up"
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
        <div className="space-y-8">
          {data.presentation && (
            <ReportPresentationNote presentation={data.presentation} />
          )}

          {data.byBaseCurrency && data.byBaseCurrency.length > 0 ? (
            data.byBaseCurrency.map((g) => (
              <BalanceBlock
                key={g.currency}
                group={g}
                money={money(g.currency)}
                t={t}
              />
            ))
          ) : data.currency ? (
            <BalanceBlock
              group={{
                currency: data.currency,
                assets: data.assets,
                totalAssets: data.totalAssets ?? 0,
                liabilities: data.liabilities,
                totalLiabilities: data.totalLiabilities ?? 0,
                equity: data.equity,
                totalEquity: data.totalEquity ?? 0,
                isBalanced: data.isBalanced,
              }}
              money={money(data.currency)}
              t={t}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function BalanceBlock({
  group,
  money,
  t,
}: {
  group: BalanceSheetCurrencyGroup
  money: (n: number) => string
  t: (k: string) => string
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="rounded-md bg-surface-secondary px-2 py-0.5 font-mono text-[13px] text-text-secondary">
          {group.currency}
        </span>
        <StatusBadge variant={group.isBalanced ? 'success' : 'danger'}>
          {group.isBalanced
            ? t('balanceSheet.balanced')
            : t('balanceSheet.unbalanced')}
        </StatusBadge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatementSection
          title={t('balanceSheet.assets')}
          lines={group.assets}
          total={group.totalAssets}
          totalLabel={t('balanceSheet.totalAssets')}
          money={money}
          emptyLabel={t('balanceSheet.noAssets')}
        />
        <div className="space-y-6">
          <StatementSection
            title={t('balanceSheet.liabilities')}
            lines={group.liabilities}
            total={group.totalLiabilities}
            totalLabel={t('balanceSheet.totalLiabilities')}
            money={money}
            emptyLabel={t('balanceSheet.noLiabilities')}
          />
          <StatementSection
            title={t('balanceSheet.equity')}
            lines={group.equity}
            total={group.totalEquity}
            totalLabel={t('balanceSheet.totalEquity')}
            money={money}
            emptyLabel={t('balanceSheet.noEquity')}
          />
        </div>
      </div>
    </div>
  )
}
