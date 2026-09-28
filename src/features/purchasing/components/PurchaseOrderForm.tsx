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
import {
  makePurchaseOrderSchema,
  type CreatePurchaseOrderInput,
  type PurchaseOrder,
  type PurchaseOrderFormValues,
} from '@/features/purchasing/types/purchasing.types'
import { useAllPartners } from '@/features/partners/hooks/useAllPartners'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { useVariants } from '@/features/items/hooks/useVariants'
import {
  localizedItemName,
  type Item,
} from '@/features/items/types/items.types'
import { useTaxRates } from '@/features/taxes/hooks/useTaxRates'
import type { TaxRate } from '@/features/taxes/types/taxes.types'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import { useCurrencyLookup } from '@/features/currencies/hooks/useCurrencyLookup'
import { formatMoney } from '@/lib/format'

const today = () => new Date().toISOString().slice(0, 10)

interface PurchaseOrderFormProps {
  onSubmit: (dto: CreatePurchaseOrderInput) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
  initial?: PurchaseOrder
}

export function PurchaseOrderForm({
  onSubmit,
  isPending,
  banner,
  submitLabel,
  initial,
}: PurchaseOrderFormProps) {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language

  const partners = useAllPartners()
  const items = useAllItems()
  const taxRates = useTaxRates()
  const currencies = useCurrencies()
  const baseCurrency = useActiveCompanyBaseCurrency()
  const lookupCurrency = useCurrencyLookup()

  const schema = useMemo(() => makePurchaseOrderSchema(t), [t])

  const emptyLine = () => ({
    itemId: '',
    variantId: '',
    qtyOrdered: undefined as unknown as number,
    unitCost: undefined as unknown as number,
    taxRateId: '',
    description: '',
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: initial
      ? {
          supplierId: initial.supplierId,
          currencyCode: initial.currencyCode,
          rate:
            initial.currencyCode === baseCurrency ? undefined : initial.rate,
          orderDate: initial.orderDate.slice(0, 10),
          expectedDate: initial.expectedDate?.slice(0, 10) ?? '',
          notes: initial.notes ?? '',
          lines: initial.lines.map((l) => ({
            itemId: l.itemId,
            variantId: l.variantId ?? '',
            qtyOrdered: l.qtyOrdered,
            unitCost: l.unitCost,
            taxRateId: l.taxRateId ?? '',
            description: l.description ?? '',
          })),
        }
      : {
          supplierId: '',
          currencyCode: baseCurrency ?? '',
          rate: undefined,
          orderDate: today(),
          expectedDate: '',
          notes: '',
          lines: [emptyLine()],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const supplierOptions = (partners.data ?? [])
    .filter((p) => p.isSupplier)
    .map((p) => ({ value: p.id, label: p.name }))

  const currencyCode = useWatch({ control, name: 'currencyCode' })
  const showRate = !!currencyCode && currencyCode !== baseCurrency

  const submit = (v: PurchaseOrderFormValues) => {
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const opt = (s: string | undefined) => s?.trim() || undefined
    onSubmit({
      supplierId: v.supplierId,
      currencyCode: v.currencyCode,
      rate: num(v.rate),
      orderDate: v.orderDate,
      expectedDate: opt(v.expectedDate),
      notes: opt(v.notes),
      lines: v.lines.map((l) => ({
        itemId: l.itemId,
        variantId: opt(l.variantId),
        qtyOrdered: l.qtyOrdered,
        unitCost: num(l.unitCost),
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
          id="po-supplier"
          label={t('form.supplier')}
          placeholder={t('form.selectSupplier')}
          options={supplierOptions}
          error={errors.supplierId?.message}
          {...register('supplierId')}
        />
        <SelectField
          id="po-currency"
          label={t('form.currency')}
          options={(currencies.data ?? [])
            .filter((c) => c.isActive)
            .map((c) => ({ value: c.code, label: c.code }))}
          error={errors.currencyCode?.message}
          {...register('currencyCode')}
        />
        {showRate && (
          <TextField
            id="po-rate"
            type="number"
            step="0.000001"
            label={t('form.rate')}
            placeholder={t('form.rateHint')}
            error={errors.rate?.message}
            {...register('rate', { valueAsNumber: true })}
          />
        )}
        <TextField
          id="po-date"
          type="date"
          label={t('form.orderDate')}
          error={errors.orderDate?.message}
          {...register('orderDate')}
        />
        <TextField
          id="po-expected"
          type="date"
          label={t('form.expectedDate')}
          {...register('expectedDate')}
        />
      </section>

      <TextareaField
        id="po-notes"
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
  control: Control<PurchaseOrderFormValues>
  register: UseFormRegister<PurchaseOrderFormValues>
  errors: FieldErrors<PurchaseOrderFormValues>
  setValue: UseFormSetValue<PurchaseOrderFormValues>
  items: Item[]
  taxRates: TaxRate[]
  onRemove: () => void
  canRemove: boolean
}) {
  const { t, i18n } = useTranslation('purchasing')
  const lang = i18n.language

  const itemId = useWatch({ control, name: `lines.${index}.itemId` })
  const item = items.find((i) => i.id === itemId)
  const hasVariants = !!item && (item.hasSize || item.hasColour)
  const variants = useVariants(hasVariants ? itemId : undefined)
  const lineErr = errors.lines?.[index]

  return (
    <div className="grid items-start gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.4fr_80px_100px_1fr_auto]">
      <SelectField
        id={`po-line-${index}-item`}
        label={t('form.line.item')}
        placeholder={t('form.line.selectItem')}
        options={items.map((i) => ({
          value: i.id,
          label: `${i.code} — ${localizedItemName(i, lang)}`,
        }))}
        error={lineErr?.itemId?.message}
        {...register(`lines.${index}.itemId`, {
          onChange: (e: { target: { value: string } }) => {
            const chosen = items.find((i) => i.id === e.target.value)
            if (chosen) {
              setValue(`lines.${index}.unitCost`, chosen.costPrice)
              if (chosen.defaultTaxRateId)
                setValue(`lines.${index}.taxRateId`, chosen.defaultTaxRateId)
            }
          },
        })}
      />
      <TextField
        id={`po-line-${index}-qty`}
        type="number"
        step="0.001"
        label={t('form.line.qty')}
        error={lineErr?.qtyOrdered?.message}
        {...register(`lines.${index}.qtyOrdered`, { valueAsNumber: true })}
      />
      <TextField
        id={`po-line-${index}-cost`}
        type="number"
        step="0.0001"
        label={t('form.line.cost')}
        error={lineErr?.unitCost?.message}
        {...register(`lines.${index}.unitCost`, { valueAsNumber: true })}
      />
      <SelectField
        id={`po-line-${index}-tax`}
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
        <div className="md:col-span-5">
          <SelectField
            id={`po-line-${index}-variant`}
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

function TotalsPreview({
  control,
  items,
  taxRates,
  currency,
  lookupCurrency,
  locale,
}: {
  control: Control<PurchaseOrderFormValues>
  items: Item[]
  taxRates: TaxRate[]
  currency: string
  lookupCurrency: (
    code: string
  ) => { code: string; decimalPlaces: number } | undefined
  locale: string
}) {
  const { t } = useTranslation('purchasing')
  const lines = useWatch({ control, name: 'lines' })

  const { subtotal, vat } = useMemo(() => {
    let sub = 0
    let vatSum = 0
    for (const l of lines ?? []) {
      const item = items.find((i) => i.id === l?.itemId)
      const qty = Number(l?.qtyOrdered)
      const cost = Number.isFinite(Number(l?.unitCost))
        ? Number(l?.unitCost)
        : (item?.costPrice ?? 0)
      if (!Number.isFinite(qty) || qty <= 0) continue
      const net = qty * cost
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
