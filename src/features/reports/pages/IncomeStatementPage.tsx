import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { StatementSection } from '@/features/reports/components/StatementSection'
import { ReportPresentationNote } from '@/features/reports/components/ReportPresentationNote'
import { useIncomeStatement } from '@/features/reports/hooks/useStatements'
import type {
  IncomeStatementCurrencyGroup,
  IncomeStatementQuery,
} from '@/features/reports/types/reports.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

const NO_CONVERSION = '__none__'
const yearStart = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

export function IncomeStatementPage() {
  const { t, i18n } = useTranslation('reports')
  const lang = i18n.language
  const companyBase = useActiveCompanyBaseCurrency()
  const currencies = useCurrencies()
  const lookupCurrency = useCurrencyLookup()

  const [from, setFrom] = useState(yearStart())
  const [to, setTo] = useState(today())
  const [rollUp, setRollUp] = useState(false)
  const [presentChoice, setPresentChoice] = useState<string | null>(null)

  const presentIn =
    presentChoice === NO_CONVERSION ? undefined : (presentChoice ?? companyBase)

  const query: IncomeStatementQuery = useMemo(
    () => ({ from, to, rollUp: rollUp || undefined, presentIn }),
    [from, to, rollUp, presentIn]
  )
  const report = useIncomeStatement(query, !!from && !!to)
  const data = report.data
  const selectValue = presentChoice ?? companyBase ?? NO_CONVERSION

  const money = (currency: string) => (n: number) =>
    formatMoney(n, lookupCurrency(currency), lang)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('incomeStatement.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('incomeStatement.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <DateField
          id="is-from"
          label={t('filters.from')}
          value={from}
          onChange={setFrom}
        />
        <DateField
          id="is-to"
          label={t('filters.to')}
          value={to}
          onChange={setTo}
        />
        <SelectField
          className="w-[160px]"
          id="is-present-in"
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
            id="is-roll-up"
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
              <IncomeBlock
                key={g.currency}
                group={g}
                money={money(g.currency)}
                t={t}
              />
            ))
          ) : data.currency ? (
            <IncomeBlock
              group={{
                currency: data.currency,
                revenue: data.revenue,
                totalRevenue: data.totalRevenue ?? 0,
                expenses: data.expenses,
                totalExpenses: data.totalExpenses ?? 0,
                netResult: data.netResult ?? 0,
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

function IncomeBlock({
  group,
  money,
  t,
}: {
  group: IncomeStatementCurrencyGroup
  money: (n: number) => string
  t: (k: string) => string
}) {
  const profit = group.netResult >= 0
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-surface-secondary px-2 py-0.5 font-mono text-[13px] text-text-secondary">
          {group.currency}
        </span>
      </div>
      <StatementSection
        title={t('incomeStatement.revenue')}
        lines={group.revenue}
        total={group.totalRevenue}
        totalLabel={t('incomeStatement.totalRevenue')}
        money={money}
        emptyLabel={t('incomeStatement.noRevenue')}
      />
      <StatementSection
        title={t('incomeStatement.expenses')}
        lines={group.expenses}
        total={group.totalExpenses}
        totalLabel={t('incomeStatement.totalExpenses')}
        money={money}
        emptyLabel={t('incomeStatement.noExpenses')}
      />
      <div
        className={`flex items-center justify-between rounded-lg px-4 py-3 text-[16px] font-bold ${
          profit ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger'
        }`}
      >
        <span>
          {profit
            ? t('incomeStatement.netProfit')
            : t('incomeStatement.netLoss')}
        </span>
        <span className="font-mono">{money(group.netResult)}</span>
      </div>
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="w-full space-y-2 sm:w-[180px]">
      <Label htmlFor={id} className="field-label">
        {label}
      </Label>
      <div className="field-box">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
