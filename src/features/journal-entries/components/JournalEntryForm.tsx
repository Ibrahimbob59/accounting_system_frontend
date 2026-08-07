import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import { usePartners } from '@/features/partners/hooks/usePartners'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { formatAmount } from '@/lib/format'
import {
  JOURNAL_SIDES,
  makeJournalEntrySchema,
} from '@/features/journal-entries/types/journal-entries.types'
import type {
  CreateJournalEntryDto,
  JournalEntry,
  JournalEntryFormValues,
} from '@/features/journal-entries/types/journal-entries.types'

interface JournalEntryFormProps {
  /** Absent = create. Present = edit a draft, and the form seeds from it. */
  entry?: JournalEntry
  onSubmit: (dto: CreateJournalEntryDto) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

const today = () => new Date().toISOString().slice(0, 10)

export function JournalEntryForm({
  entry,
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: JournalEntryFormProps) {
  const { t, i18n } = useTranslation('journalEntries')
  const allAccounts = useAllAccounts()
  const partners = usePartners({ page: 1, limit: 100 })
  const currencies = useCurrencies()
  const baseCurrency = useActiveCompanyBaseCurrency()

  const schema = useMemo(() => makeJournalEntrySchema(t), [t])

  const emptyLine = (side: 'DEBIT' | 'CREDIT') => ({
    accountId: '',
    side,
    amountOriginal: undefined as unknown as number,
    currency: baseCurrency ?? '',
    rate: undefined,
    partnerId: '',
    description: '',
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      date: entry?.date ? entry.date.slice(0, 10) : today(),
      reference: entry?.reference ?? '',
      description: entry?.description ?? '',
      lines: entry
        ? entry.lines.map((l) => ({
            accountId: l.accountId,
            side: l.side,
            amountOriginal: l.amountOriginal,
            currency: l.currency,
            rate: l.rate,
            partnerId: l.partnerId ?? '',
            description: l.description ?? '',
          }))
        : [emptyLine('DEBIT'), emptyLine('CREDIT')],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const accountOptions = useMemo(
    () =>
      (allAccounts.data ?? [])
        // Control accounts are posted through by the engine (invoices/bills);
        // a hand-written line still can, so they stay selectable, but inactive
        // accounts are filtered — the backend rejects posting to them.
        .filter((a) => a.isActive)
        .map((a) => ({
          value: a.id,
          label: `${a.number} — ${localizedAccountName(a, i18n.language)}`,
        })),
    [allAccounts.data, i18n.language]
  )

  const partnerOptions = useMemo(
    () =>
      (partners.data?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [partners.data]
  )

  const currencyOptions = useMemo(
    () =>
      (currencies.data ?? [])
        .filter((c) => c.isActive)
        .map((c) => ({ value: c.code, label: c.code })),
    [currencies.data]
  )

  const submit = (values: JournalEntryFormValues) => {
    onSubmit({
      date: values.date,
      reference: values.reference?.trim() || undefined,
      description: values.description?.trim() || undefined,
      lines: values.lines.map((l) => ({
        accountId: l.accountId,
        side: l.side,
        amountOriginal: l.amountOriginal,
        currency: l.currency,
        // Empty rate arrives as NaN; send undefined so the server defaults it.
        rate:
          typeof l.rate === 'number' && Number.isFinite(l.rate)
            ? l.rate
            : undefined,
        partnerId: l.partnerId?.trim() || undefined,
        description: l.description?.trim() || undefined,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="je-date"
          type="date"
          label={t('form.date')}
          error={errors.date?.message}
          {...register('date')}
        />
        <TextField
          id="je-reference"
          label={t('form.reference')}
          placeholder={t('form.referencePlaceholder')}
          error={errors.reference?.message}
          {...register('reference')}
        />
        <TextField
          id="je-description"
          label={t('form.description')}
          placeholder={t('form.descriptionPlaceholder')}
          error={errors.description?.message}
          {...register('description')}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-label">{t('form.linesTitle')}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyLine('DEBIT'))}
          >
            <Plus className="size-4" />
            {t('form.addLine')}
          </Button>
        </div>

        {typeof errors.lines?.message === 'string' && (
          <p className="text-[13px] text-danger">{errors.lines.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid items-start gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_110px_130px_90px_1fr_auto]"
            >
              <SelectField
                id={`je-line-${index}-account`}
                label={t('form.line.account')}
                placeholder={t('form.line.accountPlaceholder')}
                options={accountOptions}
                error={errors.lines?.[index]?.accountId?.message}
                {...register(`lines.${index}.accountId`)}
              />
              <SelectField
                id={`je-line-${index}-side`}
                label={t('form.line.side')}
                options={JOURNAL_SIDES.map((s) => ({
                  value: s,
                  label: t(`side.${s}`),
                }))}
                error={errors.lines?.[index]?.side?.message}
                {...register(`lines.${index}.side`)}
              />
              <TextField
                id={`je-line-${index}-amount`}
                type="number"
                step="0.01"
                label={t('form.line.amount')}
                error={errors.lines?.[index]?.amountOriginal?.message}
                {...register(`lines.${index}.amountOriginal`, {
                  valueAsNumber: true,
                })}
              />
              <SelectField
                id={`je-line-${index}-currency`}
                label={t('form.line.currency')}
                options={currencyOptions}
                error={errors.lines?.[index]?.currency?.message}
                {...register(`lines.${index}.currency`)}
              />
              <SelectField
                id={`je-line-${index}-partner`}
                label={t('form.line.partner')}
                placeholder={t('form.line.partnerNone')}
                options={partnerOptions}
                error={errors.lines?.[index]?.partnerId?.message}
                {...register(`lines.${index}.partnerId`)}
              />
              <div className="flex flex-col gap-1">
                <span className="field-label opacity-0">·</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('form.line.remove')}
                  disabled={fields.length <= 2}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="md:col-span-6">
                <details className="text-[13px] text-text-muted">
                  <summary className="cursor-pointer select-none">
                    {t('form.line.more')}
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TextField
                      id={`je-line-${index}-rate`}
                      type="number"
                      step="0.000001"
                      label={t('form.line.rate')}
                      placeholder={t('form.line.ratePlaceholder')}
                      error={errors.lines?.[index]?.rate?.message}
                      {...register(`lines.${index}.rate`, {
                        valueAsNumber: true,
                      })}
                    />
                    <TextField
                      id={`je-line-${index}-memo`}
                      label={t('form.line.memo')}
                      error={errors.lines?.[index]?.description?.message}
                      {...register(`lines.${index}.description`)}
                    />
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>

        <BalanceSummary control={control} locale={i18n.language} />
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}

/**
 * Live per-currency debit/credit totals. The authoritative balance check is the
 * server's — it happens in the base currency after applying FX rates this form
 * doesn't resolve — so this is a guide, not a gate: it sums `amountOriginal`
 * within each currency and flags any that doesn't net to zero. For the common
 * single-currency entry that IS the base-currency check; for a mixed-currency
 * entry it's a sanity aid and a note points to the server as the final word.
 */
function BalanceSummary({
  control,
  locale,
}: {
  control: Control<JournalEntryFormValues>
  locale: string
}) {
  const { t } = useTranslation('journalEntries')
  const lookupCurrency = useCurrencyLookup()
  const lines = useWatch({ control, name: 'lines' })

  const byCurrency = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>()
    for (const l of lines ?? []) {
      const amount = Number(l?.amountOriginal)
      if (!l?.currency || !Number.isFinite(amount)) continue
      const entry = map.get(l.currency) ?? { debit: 0, credit: 0 }
      if (l.side === 'CREDIT') entry.credit += amount
      else entry.debit += amount
      map.set(l.currency, entry)
    }
    return [...map.entries()]
  }, [lines])

  if (byCurrency.length === 0) return null

  const multiCurrency = byCurrency.length > 1

  return (
    <div className="space-y-2 rounded-lg bg-surface-secondary p-4">
      {byCurrency.map(([currency, { debit, credit }]) => {
        const diff = Math.round((debit - credit) * 100) / 100
        const balanced = diff === 0
        const fmt = (n: number) =>
          formatAmount(n, currency, {
            locale,
            decimals: lookupCurrency(currency)?.decimalPlaces,
          })
        return (
          <div
            key={currency}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[14px]"
          >
            <span className="text-text-muted">
              {t('form.balance.debit')} {fmt(debit)}
              <span className="mx-2">·</span>
              {t('form.balance.credit')} {fmt(credit)}
            </span>
            <span
              className={balanced ? 'text-brand' : 'font-medium text-danger'}
            >
              {balanced
                ? t('form.balance.balanced')
                : t('form.balance.off', { amount: fmt(Math.abs(diff)) })}
            </span>
          </div>
        )
      })}
      {multiCurrency && (
        <p className="text-[13px] text-text-muted">
          {t('form.balance.multiCurrencyNote')}
        </p>
      )}
    </div>
  )
}
