import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TextField } from '@/components/common/TextField'
import { TextareaField } from '@/components/common/TextareaField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  makePaymentSchema,
  PAYMENT_DIRECTIONS,
  PAYMENT_METHODS,
  type CreatePaymentInput,
  type PaymentFormValues,
} from '@/features/payments/types/payments.types'
import { useOpenItems } from '@/features/payments/hooks/useOpenItems'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney, formatDate } from '@/lib/format'

const today = () => new Date().toISOString().slice(0, 10)
const EPS = 0.005

interface PaymentFormProps {
  onSubmit: (dto: CreatePaymentInput) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

export function PaymentForm({
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: PaymentFormProps) {
  const { t, i18n } = useTranslation('payments')
  const lang = i18n.language

  const partners = useAllPartners()
  const accounts = useAllAccounts()
  const currencies = useCurrencies()
  const baseCurrency = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()

  const schema = useMemo(() => makePaymentSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      direction: 'IN',
      partnerId: '',
      cashAccountId: '',
      method: 'CASH',
      currencyCode: baseCurrency ?? '',
      rate: undefined,
      amount: undefined as unknown as number,
      paymentDate: today(),
      reference: '',
      notes: '',
    },
  })

  const direction = useWatch({ control, name: 'direction' })
  const partnerId = useWatch({ control, name: 'partnerId' })
  const currencyCode = useWatch({ control, name: 'currencyCode' })
  const amount = useWatch({ control, name: 'amount' })

  // Allocations are local state — the open-item set loads async per partner.
  // Reset them whenever the partner / direction / currency changes, using the
  // "adjust state during render on a key change" pattern (no effect needed).
  const [alloc, setAlloc] = useState<Record<string, number>>({})
  const allocKey = `${direction}|${partnerId}|${currencyCode}`
  const [prevAllocKey, setPrevAllocKey] = useState(allocKey)
  if (allocKey !== prevAllocKey) {
    setPrevAllocKey(allocKey)
    setAlloc({})
  }

  const openItems = useOpenItems(partnerId || undefined, direction)
  // Allocation must be in the payment currency (backend rule), so only offer
  // open documents that match the chosen currency.
  const items = (openItems.data ?? []).filter(
    (it) => it.currencyCode === currencyCode
  )

  const showRate = !!currencyCode && currencyCode !== baseCurrency
  const currency = currencyCode ? lookupCurrency(currencyCode) : undefined
  const money = (n: number) => formatMoney(n, currency, lang)

  const amountNum = Number.isFinite(Number(amount)) ? Number(amount) : 0
  const totalAllocated = Object.values(alloc).reduce((s, n) => s + n, 0)
  const unallocated = Math.round((amountNum - totalAllocated) * 100) / 100
  const overAllocated = totalAllocated > amountNum + EPS

  const partnerOptions = (partners.data ?? [])
    .filter((p) => (direction === 'IN' ? p.isCustomer : p.isSupplier))
    .map((p) => ({ value: p.id, label: p.name }))

  const cashAccountOptions = (accounts.data ?? [])
    .filter(
      (a) =>
        a.isActive && (a.controlType === 'CASH' || a.controlType === 'BANK')
    )
    .map((a) => ({ value: a.id, label: `${a.number} — ${a.name}` }))

  const setLine = (docId: string, value: string, max: number) => {
    const v = Number(value)
    const clamped =
      !Number.isFinite(v) || v <= 0
        ? 0
        : Math.min(Math.round(v * 100) / 100, max)
    setAlloc((prev) => {
      const next = { ...prev }
      if (clamped > 0) next[docId] = clamped
      else delete next[docId]
      return next
    })
  }

  const submit = (v: PaymentFormValues) => {
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const opt = (s: string | undefined) => s?.trim() || undefined
    const allocations = Object.entries(alloc)
      .filter(([, amt]) => amt > 0)
      .map(([documentId, amt]) => ({ documentId, amount: amt }))
    onSubmit({
      direction: v.direction,
      partnerId: v.partnerId,
      cashAccountId: v.cashAccountId,
      method: v.method,
      currencyCode: v.currencyCode,
      rate: num(v.rate),
      amount: v.amount,
      paymentDate: v.paymentDate,
      reference: opt(v.reference),
      notes: opt(v.notes),
      allocations: allocations.length ? allocations : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="pay-direction"
          label={t('form.direction')}
          options={PAYMENT_DIRECTIONS.map((d) => ({
            value: d,
            label: t(`direction.${d}`),
          }))}
          error={errors.direction?.message}
          {...register('direction')}
        />
        <SelectField
          id="pay-partner"
          label={direction === 'IN' ? t('form.customer') : t('form.supplier')}
          placeholder={t('form.selectPartner')}
          options={partnerOptions}
          error={errors.partnerId?.message}
          {...register('partnerId')}
        />
        <SelectField
          id="pay-cash-account"
          label={t('form.cashAccount')}
          placeholder={t('form.selectCashAccount')}
          options={cashAccountOptions}
          error={errors.cashAccountId?.message}
          {...register('cashAccountId')}
        />
        <SelectField
          id="pay-method"
          label={t('form.method')}
          options={PAYMENT_METHODS.map((m) => ({
            value: m,
            label: t(`method.${m}`),
          }))}
          error={errors.method?.message}
          {...register('method')}
        />
        <SelectField
          id="pay-currency"
          label={t('form.currency')}
          options={(currencies.data ?? [])
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.code, label: c.code }))}
          error={errors.currencyCode?.message}
          {...register('currencyCode')}
        />
        {showRate && (
          <TextField
            id="pay-rate"
            type="number"
            step="0.000001"
            label={t('form.rate')}
            placeholder={t('form.rateHint')}
            error={errors.rate?.message}
            {...register('rate', { valueAsNumber: true })}
          />
        )}
        <TextField
          id="pay-amount"
          type="number"
          step="0.01"
          label={t('form.amount')}
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
        <TextField
          id="pay-date"
          type="date"
          label={t('form.paymentDate')}
          error={errors.paymentDate?.message}
          {...register('paymentDate')}
        />
        <TextField
          id="pay-ref"
          label={t('form.reference')}
          placeholder={t('form.referenceHint')}
          {...register('reference')}
        />
      </section>

      <TextareaField
        id="pay-notes"
        label={t('form.notes')}
        {...register('notes')}
      />

      {/* Allocation table — appears once a partner + direction are chosen. */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-label">{t('form.allocations.title')}</h2>
          <p className="text-[13px] text-text-muted">
            {t('form.allocations.hint')}
          </p>
        </div>

        {!partnerId ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[14px] text-text-muted">
            {t('form.allocations.pickPartner')}
          </p>
        ) : openItems.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[14px] text-text-muted">
            {t('form.allocations.none')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-[13px] text-text-muted">
                  <th className="px-4 py-2.5 font-medium">
                    {t('form.allocations.document')}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t('form.allocations.date')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('form.allocations.balance')}
                  </th>
                  <th className="px-4 py-2.5 text-end font-medium">
                    {t('form.allocations.apply')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.documentId}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-2.5 font-mono text-[13px]">
                      {it.number}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">
                      {formatDate(it.date, lang)}
                    </td>
                    <td className="px-4 py-2.5 text-end font-mono">
                      {money(it.balanceOriginal)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={it.balanceOriginal}
                          className="w-32 text-end font-mono"
                          value={alloc[it.documentId] ?? ''}
                          onChange={(e) =>
                            setLine(
                              it.documentId,
                              e.target.value,
                              it.balanceOriginal
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setLine(
                              it.documentId,
                              String(
                                Math.min(
                                  it.balanceOriginal,
                                  Math.max(
                                    (alloc[it.documentId] ?? 0) +
                                      Math.max(unallocated, 0),
                                    0
                                  )
                                )
                              ),
                              it.balanceOriginal
                            )
                          }
                        >
                          {t('form.allocations.fill')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {partnerId && items.length > 0 && (
          <div className="ms-auto max-w-xs space-y-1 rounded-lg bg-surface-secondary p-4 text-[14px]">
            <div className="flex justify-between text-text-secondary">
              <span>{t('form.allocations.paymentAmount')}</span>
              <span className="font-mono">{money(amountNum)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>{t('form.allocations.allocated')}</span>
              <span className="font-mono">{money(totalAllocated)}</span>
            </div>
            <div
              className={`flex justify-between border-t border-border pt-1 font-semibold ${
                overAllocated ? 'text-danger' : 'text-text-primary'
              }`}
            >
              <span>{t('form.allocations.onAccount')}</span>
              <span className="font-mono">{money(unallocated)}</span>
            </div>
            {overAllocated && (
              <p className="pt-1 text-[12px] text-danger">
                {t('form.allocations.overAllocated')}
              </p>
            )}
          </div>
        )}
      </section>

      <Button type="submit" disabled={isPending || overAllocated}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
