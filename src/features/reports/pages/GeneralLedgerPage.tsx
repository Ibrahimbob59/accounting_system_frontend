import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { ReportPresentationNote } from '@/features/reports/components/ReportPresentationNote'
import { useGeneralLedger } from '@/features/reports/hooks/useStatements'
import type {
  GeneralLedgerRow,
  GeneralLedgerQuery,
} from '@/features/reports/types/reports.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const NO_CONVERSION = '__none__'
const yearStart = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

export function GeneralLedgerPage() {
  const { t, i18n } = useTranslation('reports')
  const lang = i18n.language
  const companyBase = useActiveCompanyBaseCurrency()
  const accounts = useAllAccounts()
  const currencies = useCurrencies()
  const lookupCurrency = useCurrencyLookup()

  const [accountId, setAccountId] = useState('')
  const [from, setFrom] = useState(yearStart())
  const [to, setTo] = useState(today())
  const [presentChoice, setPresentChoice] = useState<string | null>(null)

  const presentIn =
    presentChoice === NO_CONVERSION ? undefined : (presentChoice ?? companyBase)

  const query: GeneralLedgerQuery = useMemo(
    () => ({ accountId, from, to, presentIn }),
    [accountId, from, to, presentIn]
  )
  const report = useGeneralLedger(query, !!accountId && !!from && !!to)
  const data = report.data
  const selectValue = presentChoice ?? companyBase ?? NO_CONVERSION

  // Only postable (leaf) accounts make sense here, but the ledger accepts any.
  const accountOptions = (accounts.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.number} — ${a.name}`,
  }))

  const money = (n: number, currency: string) =>
    formatMoney(n, lookupCurrency(currency), lang)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('generalLedger.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('generalLedger.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          className="w-full sm:w-[320px]"
          id="gl-account"
          label={t('generalLedger.account')}
          placeholder={t('generalLedger.selectAccount')}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accountOptions}
        />
        <DateField
          id="gl-from"
          label={t('filters.from')}
          value={from}
          onChange={setFrom}
        />
        <DateField
          id="gl-to"
          label={t('filters.to')}
          value={to}
          onChange={setTo}
        />
        <SelectField
          className="w-[160px]"
          id="gl-present-in"
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
      </div>

      {!accountId ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[14px] text-text-muted">
          {t('generalLedger.pickAccount')}
        </p>
      ) : report.isLoading ? (
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
          <p className="text-[15px] text-text-primary">
            <span className="font-mono">{data.accountNumber}</span> —{' '}
            {data.accountName}
          </p>
          {data.presentation && (
            <ReportPresentationNote presentation={data.presentation} />
          )}

          {data.byBaseCurrency && data.byBaseCurrency.length > 0 ? (
            <div className="space-y-8">
              {data.byBaseCurrency.map((g) => (
                <LedgerTable
                  key={g.currency}
                  currency={g.currency}
                  openingBalance={g.openingBalance}
                  rows={g.rows}
                  totalDebit={g.totalDebit}
                  totalCredit={g.totalCredit}
                  closingBalance={g.closingBalance}
                  money={money}
                  formatDate={(d) => formatDate(d, lang)}
                  labels={ledgerLabels(t)}
                />
              ))}
            </div>
          ) : data.currency ? (
            <LedgerTable
              currency={data.currency}
              openingBalance={data.openingBalance ?? 0}
              rows={data.rows}
              totalDebit={data.totalDebit ?? 0}
              totalCredit={data.totalCredit ?? 0}
              closingBalance={data.closingBalance ?? 0}
              money={money}
              formatDate={(d) => formatDate(d, lang)}
              labels={ledgerLabels(t)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface LedgerLabels {
  opening: string
  closing: string
  date: string
  entry: string
  description: string
  debit: string
  credit: string
  balance: string
}

function ledgerLabels(t: (k: string) => string): LedgerLabels {
  return {
    opening: t('generalLedger.opening'),
    closing: t('generalLedger.closing'),
    date: t('generalLedger.columns.date'),
    entry: t('generalLedger.columns.entry'),
    description: t('generalLedger.columns.description'),
    debit: t('generalLedger.columns.debit'),
    credit: t('generalLedger.columns.credit'),
    balance: t('generalLedger.columns.balance'),
  }
}

function LedgerTable({
  currency,
  openingBalance,
  rows,
  totalDebit,
  totalCredit,
  closingBalance,
  money,
  formatDate,
  labels,
}: {
  currency: string
  openingBalance: number
  rows: GeneralLedgerRow[]
  totalDebit: number
  totalCredit: number
  closingBalance: number
  money: (n: number, currency: string) => string
  formatDate: (d: string) => string
  labels: LedgerLabels
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-surface-secondary px-2 py-0.5 font-mono text-[13px] text-text-secondary">
          {currency}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
              <th className="px-4 py-2.5 font-medium">{labels.date}</th>
              <th className="px-4 py-2.5 font-medium">{labels.entry}</th>
              <th className="px-4 py-2.5 font-medium">{labels.description}</th>
              <th className="px-4 py-2.5 text-end font-medium">
                {labels.debit}
              </th>
              <th className="px-4 py-2.5 text-end font-medium">
                {labels.credit}
              </th>
              <th className="px-4 py-2.5 text-end font-medium">
                {labels.balance}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-surface-secondary/40">
              <td className="px-4 py-2 text-text-muted" colSpan={5}>
                {labels.opening}
              </td>
              <td className="px-4 py-2 text-end font-mono text-text-secondary">
                {money(openingBalance, currency)}
              </td>
            </tr>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {formatDate(r.date)}
                </td>
                <td className="px-4 py-2.5 font-mono text-[13px]">
                  {r.entryNumber ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {r.description ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-end font-mono">
                  {r.debit ? money(r.debit, currency) : '—'}
                </td>
                <td className="px-4 py-2.5 text-end font-mono">
                  {r.credit ? money(r.credit, currency) : '—'}
                </td>
                <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                  {money(r.runningBalance, currency)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border font-semibold">
              <td className="px-4 py-2.5" colSpan={3}>
                {labels.closing}
              </td>
              <td className="px-4 py-2.5 text-end font-mono">
                {money(totalDebit, currency)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono">
                {money(totalCredit, currency)}
              </td>
              <td className="px-4 py-2.5 text-end font-mono text-text-primary">
                {money(closingBalance, currency)}
              </td>
            </tr>
          </tbody>
        </table>
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
    <div className="w-full space-y-2 sm:w-[170px]">
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
