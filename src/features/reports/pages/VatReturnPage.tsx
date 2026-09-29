import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectField } from '@/components/common/SelectField'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ReportPresentationNote } from '@/features/reports/components/ReportPresentationNote'
import { useVatReturn } from '@/features/reports/hooks/useStatements'
import type {
  VatDirection,
  VatReturnQuery,
} from '@/features/reports/types/reports.types'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

const NO_CONVERSION = '__none__'
const yearStart = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

const DIRECTION_VARIANT: Record<
  VatDirection,
  'warning' | 'success' | 'neutral'
> = { PAYABLE: 'warning', RECOVERABLE: 'success', NIL: 'neutral' }

export function VatReturnPage() {
  const { t, i18n } = useTranslation('reports')
  const lang = i18n.language
  const companyBase = useActiveCompanyBaseCurrency()
  const currencies = useCurrencies()
  const lookupCurrency = useCurrencyLookup()

  const [from, setFrom] = useState(yearStart())
  const [to, setTo] = useState(today())
  const [presentChoice, setPresentChoice] = useState<string | null>(null)

  const presentIn =
    presentChoice === NO_CONVERSION ? undefined : (presentChoice ?? companyBase)

  const query: VatReturnQuery = useMemo(
    () => ({ from, to, presentIn }),
    [from, to, presentIn]
  )
  const report = useVatReturn(query, !!from && !!to)
  const data = report.data
  const selectValue = presentChoice ?? companyBase ?? NO_CONVERSION

  const money = (n: number, currency: string) =>
    formatMoney(n, lookupCurrency(currency), lang)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('vatReturn.title')}
        </h1>
        <p className="mt-2 text-[15px] text-text-muted">
          {t('vatReturn.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <DateField
          id="vat-from"
          label={t('filters.from')}
          value={from}
          onChange={setFrom}
        />
        <DateField
          id="vat-to"
          label={t('filters.to')}
          value={to}
          onChange={setTo}
        />
        <SelectField
          className="w-[180px]"
          id="vat-present-in"
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

      {report.isLoading ? (
        <Spinner />
      ) : report.isError ? (
        <ErrorNote isDenied={isPermissionDenied(report.error)} />
      ) : data ? (
        <div className="space-y-6">
          {data.presentation && (
            <ReportPresentationNote presentation={data.presentation} />
          )}

          {data.byBaseCurrency && data.byBaseCurrency.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.byBaseCurrency.map((g) => (
                <VatCard
                  key={g.currency}
                  currency={g.currency}
                  outputVat={g.outputVat}
                  inputVat={g.inputVat}
                  netVat={g.netVat}
                  direction={g.direction}
                  money={money}
                  t={t}
                />
              ))}
            </div>
          ) : data.currency ? (
            <div className="max-w-md">
              <VatCard
                currency={data.currency}
                outputVat={data.outputVat ?? 0}
                inputVat={data.inputVat ?? 0}
                netVat={data.netVat ?? 0}
                direction={data.direction ?? 'NIL'}
                money={money}
                t={t}
              />
            </div>
          ) : (
            <p className="py-8 text-center text-text-muted">
              {t('vatReturn.noData')}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function VatCard({
  currency,
  outputVat,
  inputVat,
  netVat,
  direction,
  money,
  t,
}: {
  currency: string
  outputVat: number
  inputVat: number
  netVat: number
  direction: VatDirection
  money: (n: number, currency: string) => string
  t: TFunction<'reports'>
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-text-primary">
          {currency}
        </h2>
        <StatusBadge variant={DIRECTION_VARIANT[direction]}>
          {t(`vatReturn.direction.${direction}`)}
        </StatusBadge>
      </div>
      <Row
        label={t('vatReturn.outputVat')}
        value={money(outputVat, currency)}
      />
      <Row label={t('vatReturn.inputVat')} value={money(inputVat, currency)} />
      <div className="flex items-center justify-between border-t border-border pt-2 text-[16px] font-bold text-text-primary">
        <span>{t('vatReturn.netVat')}</span>
        <span className="font-mono">{money(netVat, currency)}</span>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[14px] text-text-secondary">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
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

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-brand" />
    </div>
  )
}

function ErrorNote({ isDenied }: { isDenied: boolean }): ReactNode {
  const { t } = useTranslation('reports')
  return (
    <p className="py-8 text-center text-text-muted">
      {isDenied ? t('errors.permissionDeniedSection') : t('errors.generic')}
    </p>
  )
}
