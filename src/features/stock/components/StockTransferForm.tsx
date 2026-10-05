import { useMemo } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
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
  makeStockTransferSchema,
  type CreateStockTransferInput,
  type StockTransferFormValues,
} from '@/features/stock/types/stock-ops.types'
import { useLocations } from '@/features/stock/hooks/useLocations'
import { localizedLocationName } from '@/features/stock/types/stock.types'
import { useAllItems } from '@/features/items/hooks/useAllItems'
import { useVariants } from '@/features/items/hooks/useVariants'
import {
  localizedItemName,
  type Item,
} from '@/features/items/types/items.types'

const today = () => new Date().toISOString().slice(0, 10)

interface StockTransferFormProps {
  onSubmit: (dto: CreateStockTransferInput) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

export function StockTransferForm({
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: StockTransferFormProps) {
  const { t, i18n } = useTranslation('stockOps')
  const lang = i18n.language
  const locations = useLocations({ type: 'INTERNAL' })
  const items = useAllItems()

  const schema = useMemo(() => makeStockTransferSchema(t), [t])

  const emptyLine = () => ({
    itemId: '',
    variantId: '',
    qty: undefined as unknown as number,
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StockTransferFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fromLocationId: '',
      toLocationId: '',
      transferDate: today(),
      notes: '',
      lines: [emptyLine()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const locationOptions = (locations.data ?? []).map((l) => ({
    value: l.id,
    label: `${l.code} — ${localizedLocationName(l, lang)}`,
  }))

  const submit = (v: StockTransferFormValues) => {
    const opt = (s: string | undefined) => s?.trim() || undefined
    onSubmit({
      fromLocationId: v.fromLocationId,
      toLocationId: v.toLocationId,
      transferDate: v.transferDate,
      notes: opt(v.notes),
      lines: v.lines.map((l) => ({
        itemId: l.itemId,
        variantId: opt(l.variantId),
        qty: l.qty,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="trf-from"
          label={t('transfer.form.from')}
          placeholder={t('transfer.form.selectLocation')}
          options={locationOptions}
          error={errors.fromLocationId?.message}
          {...register('fromLocationId')}
        />
        <SelectField
          id="trf-to"
          label={t('transfer.form.to')}
          placeholder={t('transfer.form.selectLocation')}
          options={locationOptions}
          error={errors.toLocationId?.message}
          {...register('toLocationId')}
        />
        <TextField
          id="trf-date"
          type="date"
          label={t('transfer.form.date')}
          error={errors.transferDate?.message}
          {...register('transferDate')}
        />
      </section>

      <TextareaField
        id="trf-notes"
        label={t('form.notes')}
        {...register('notes')}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-label">{t('transfer.form.linesTitle')}</h2>
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
              items={items.data ?? []}
              onRemove={() => remove(index)}
              canRemove={fields.length > 1}
            />
          ))}
        </div>
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
  items,
  onRemove,
  canRemove,
}: {
  index: number
  control: Control<StockTransferFormValues>
  register: UseFormRegister<StockTransferFormValues>
  errors: FieldErrors<StockTransferFormValues>
  items: Item[]
  onRemove: () => void
  canRemove: boolean
}) {
  const { t, i18n } = useTranslation('stockOps')
  const lang = i18n.language

  const itemId = useWatch({ control, name: `lines.${index}.itemId` })
  const item = items.find((i) => i.id === itemId)
  const hasVariants = !!item && (item.hasSize || item.hasColour)
  const variants = useVariants(hasVariants ? itemId : undefined)
  const lineErr = errors.lines?.[index]

  return (
    <div className="grid items-start gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.6fr_120px_auto]">
      <SelectField
        id={`trf-line-${index}-item`}
        label={t('transfer.form.line.item')}
        placeholder={t('transfer.form.line.selectItem')}
        options={items.map((i) => ({
          value: i.id,
          label: `${i.code} — ${localizedItemName(i, lang)}`,
        }))}
        error={lineErr?.itemId?.message}
        {...register(`lines.${index}.itemId`)}
      />
      <TextField
        id={`trf-line-${index}-qty`}
        type="number"
        step="0.001"
        label={t('transfer.form.line.qty')}
        error={lineErr?.qty?.message}
        {...register(`lines.${index}.qty`, { valueAsNumber: true })}
      />
      <div className="flex flex-col gap-1">
        <span className="field-label opacity-0">·</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('form.removeLine')}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {hasVariants && (
        <div className="md:col-span-3">
          <SelectField
            id={`trf-line-${index}-variant`}
            label={t('transfer.form.line.variant')}
            placeholder={t('transfer.form.line.selectVariant')}
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
