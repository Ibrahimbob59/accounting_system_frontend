import { useMemo } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type FieldErrors,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { TextareaField } from '@/components/common/TextareaField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { makeSalesInvoiceSchema } from '@/features/invoicing/types/invoicing.types'
import type {
  CreateSalesInvoiceInput,
  SalesInvoiceFormValues,
} from '@/features/invoicing/types/invoicing.types'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { useVariants } from '@/features/items/hooks/useVariants'
import {
  localizedItemName,
  type Item,
} from '@/features/items/types/items.types'
import { useTaxRates } from '@/features/taxes/hooks/useTaxRates'
import type { TaxRate } from '@/features/taxes/types/taxes.types'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

const today = () => new Date().toISOString().slice(0, 10)

interface SalesInvoiceFormProps {
  onSubmit: (dto: CreateSalesInvoiceInput) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

export function SalesInvoiceForm({
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: SalesInvoiceFormProps) {
  const { t, i18n } = useTranslation('invoicing')
  const lang = i18n.language

  const partners = useAllPartners()
  const items = useAllItems()
  const taxRates = useTaxRates()
  const locations = useLocations({ type: 'INTERNAL' })
  const currencies = useCurrencies()
  const baseCurrency = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()

  const schema = useMemo(() => makeSalesInvoiceSchema(t), [t])

  const emptyLine = () => ({
    itemId: '',
    variantId: '',
    qty: undefined as unknown as number,
    unitPrice: undefined as unknown as number,
    lineDiscountPct: undefined as unknown as number,
    taxRateId: '',
    description: '',
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      customerId: '',
      currencyCode: baseCurrency ?? '',
      rate: undefined,
      invoiceDate: today(),
      dueDate: '',
      locationId: '',
      customerRef: '',
      notes: '',
      lines: [emptyLine()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const customerOptions = (partners.data ?? [])
    .filter((p) => p.isCustomer)
    .map((p) => ({ value: p.id, label: p.name }))

  const currencyCode = useWatch({ control, name: 'currencyCode' })
  const showRate = !!currencyCode && currencyCode !== baseCurrency

  const submit = (v: SalesInvoiceFormValues) => {
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const opt = (s: string | undefined) => s?.trim() || undefined
    onSubmit({
      customerId: v.customerId,
      currencyCode: v.currencyCode,
      rate: num(v.rate),
      invoiceDate: v.invoiceDate,
      dueDate: opt(v.dueDate),
      locationId: opt(v.locationId),
      customerRef: opt(v.customerRef),
      notes: opt(v.notes),
      lines: v.lines.map((l) => ({
        itemId: l.itemId,
        variantId: opt(l.variantId),
        qty: l.qty,
        unitPrice: num(l.unitPrice),
        lineDiscountPct: num(l.lineDiscountPct),
        taxRateId: opt(l.taxRateId),
        description: opt(l.description),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="si-customer"
          label={t('form.customer')}
          placeholder={t('form.selectCustomer')}
          options={customerOptions}
          error={errors.customerId?.message}
          {...register('customerId')}
        />
        <SelectField
          id="si-currency"
          label={t('form.currency')}
          options={(currencies.data ?? [])
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.code, label: c.code }))}
          error={errors.currencyCode?.message}
          {...register('currencyCode')}
        />
        {showRate && (
          <TextField
            id="si-rate"
            type="number"
            step="0.000001"
            label={t('form.rate')}
            placeholder={t('form.rateHint')}
            error={errors.rate?.message}
            {...register('rate', { valueAsNumber: true })}
          />
        )}
        <TextField
          id="si-date"
          type="date"
          label={t('form.invoiceDate')}
          error={errors.invoiceDate?.message}
          {...register('invoiceDate')}
        />
        <TextField
          id="si-due"
          type="date"
          label={t('form.dueDate')}
          {...register('dueDate')}
        />
        <SelectField
          id="si-location"
          label={t('form.location')}
          placeholder={t('form.locationHint')}
          options={(locations.data ?? []).map((l) => ({
            value: l.id,
            label: `${l.code} — ${localizedLocationName(l, lang)}`,
          }))}
          {...register('locationId')}
        />
        <TextField
          id="si-ref"
          label={t('form.customerRef')}
          {...register('customerRef')}
        />
      </section>

      <TextareaField
        id="si-notes"
        label={t('form.notes')}
        {...register('notes')}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-label">{t('form.linesTitle')}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyLine())}
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
            <LineRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              items={items.data ?? []}
              taxRates={taxRates.data ?? []}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
            />
          ))}
        </div>

        <TotalsPreview
          control={control}
          items={items.data ?? []}
          taxRates={taxRates.data ?? []}
          currency={currencyCode}
          lookupCurrency={lookupCurrency}
          locale={lang}
        />
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}

function LineRow({
  index,
  control,
  register,
  errors,
  setValue,
  items,
  taxRates,
  onRemove,
  canRemove,
}: {
  index: number
  control: Control<SalesInvoiceFormValues>
  register: UseFormRegister<SalesInvoiceFormValues>
  errors: FieldErrors<SalesInvoiceFormValues>
  setValue: UseFormSetValue<SalesInvoiceFormValues>
  items: Item[]
  taxRates: TaxRate[]
  onRemove: () => void
  canRemove: boolean
}) {
  const { t, i18n } = useTranslation('invoicing')
  const lang = i18n.language

  const itemId = useWatch({ control, name: `lines.${index}.itemId` })
  const item = items.find((i) => i.id === itemId)
  const hasVariants = !!item && (item.hasSize || item.hasColour)
  const variants = useVariants(hasVariants ? itemId : undefined)
  const lineErr = errors.lines?.[index]

  return (
    <div className="grid items-start gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.4fr_80px_100px_80px_1fr_auto]">
      <SelectField
        id={`si-line-${index}-item`}
        label={t('form.line.item')}
        placeholder={t('form.line.selectItem')}
        options={items.map((i) => ({
          value: i.id,
          label: `${i.code} — ${localizedItemName(i, lang)}`,
        }))}
        error={lineErr?.itemId?.message}
        {...register(`lines.${index}.itemId`, {
          onChange: (e: { target: { value: string } }) => {
            // Default the unit price + tax rate from the chosen item.
            const chosen = items.find((i) => i.id === e.target.value)
            if (chosen) {
              setValue(`lines.${index}.unitPrice`, chosen.salePrice)
              if (chosen.defaultTaxRateId)
                setValue(`lines.${index}.taxRateId`, chosen.defaultTaxRateId)
            }
          },
        })}
      />
      <TextField
        id={`si-line-${index}-qty`}
        type="number"
        step="0.001"
        label={t('form.line.qty')}
        error={lineErr?.qty?.message}
        {...register(`lines.${index}.qty`, { valueAsNumber: true })}
      />
      <TextField
        id={`si-line-${index}-price`}
        type="number"
        step="0.0001"
        label={t('form.line.price')}
        error={lineErr?.unitPrice?.message}
        {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
      />
      <TextField
        id={`si-line-${index}-disc`}
        type="number"
        step="0.01"
        label={t('form.line.discount')}
        error={lineErr?.lineDiscountPct?.message}
        {...register(`lines.${index}.lineDiscountPct`, { valueAsNumber: true })}
      />
      <SelectField
        id={`si-line-${index}-tax`}
        label={t('form.line.tax')}
        placeholder={t('form.line.noTax')}
        options={taxRates.map((r) => ({
          value: r.id,
          label: `${r.name} (${r.ratePct}%)`,
        }))}
        {...register(`lines.${index}.taxRateId`)}
      />
      <div className="flex flex-col gap-1">
        <span className="field-label opacity-0">·</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('form.line.remove')}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {hasVariants && (
        <div className="md:col-span-6">
          <SelectField
            id={`si-line-${index}-variant`}
            label={t('form.line.variant')}
            placeholder={t('form.line.selectVariant')}
            options={(variants.data ?? []).map((v) => ({
              value: v.id,
              label: v.sku || v.id.slice(0, 8),
            }))}
            {...register(`lines.${index}.variantId`)}
          />
        </div>
      )}
    </div>
  )
}

/** Client-side totals preview — the server recomputes authoritatively, so this
 *  is guidance only. Uses the line's tax rate, else the item's default. */
function TotalsPreview({
  control,
  items,
  taxRates,
  currency,
  lookupCurrency,
  locale,
}: {
  control: Control<SalesInvoiceFormValues>
  items: Item[]
  taxRates: TaxRate[]
  currency: string
  lookupCurrency: (
    code: string
  ) => { code: string; decimalPlaces: number } | undefined
  locale: string
}) {
  const { t } = useTranslation('invoicing')
  const lines = useWatch({ control, name: 'lines' })

  const { subtotal, vat } = useMemo(() => {
    let sub = 0
    let vatSum = 0
    for (const l of lines ?? []) {
      const item = items.find((i) => i.id === l?.itemId)
      const qty = Number(l?.qty)
      const price = Number.isFinite(Number(l?.unitPrice))
        ? Number(l?.unitPrice)
        : (item?.salePrice ?? 0)
      if (!Number.isFinite(qty) || qty <= 0) continue
      const disc = Number.isFinite(Number(l?.lineDiscountPct))
        ? Number(l?.lineDiscountPct)
        : 0
      const net = qty * price * (1 - disc / 100)
      const rateId = l?.taxRateId || item?.defaultTaxRateId
      const ratePct = taxRates.find((r) => r.id === rateId)?.ratePct ?? 0
      sub += net
      vatSum += (net * ratePct) / 100
    }
    return { subtotal: sub, vat: vatSum }
  }, [lines, items, taxRates])

  const rec = currency ? lookupCurrency(currency) : undefined
  const money = (n: number) =>
    formatMoney(Math.round(n * 100) / 100, rec, locale)

  return (
    <div className="ms-auto max-w-xs space-y-1 rounded-lg bg-surface-secondary p-4 text-[14px]">
      <div className="flex justify-between text-text-secondary">
        <span>{t('detail.totals.subtotal')}</span>
        <span className="font-mono">{money(subtotal)}</span>
      </div>
      <div className="flex justify-between text-text-secondary">
        <span>{t('detail.totals.vat')}</span>
        <span className="font-mono">{money(vat)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1 font-semibold text-text-primary">
        <span>{t('detail.totals.grand')}</span>
        <span className="font-mono">{money(subtotal + vat)}</span>
      </div>
      <p className="pt-1 text-[12px] text-text-muted">
        {t('form.previewNote')}
      </p>
    </div>
  )
}
