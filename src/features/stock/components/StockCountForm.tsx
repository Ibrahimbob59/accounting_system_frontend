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
  makeStockCountSchema,
  type CreateStockCountInput,
  type StockCountFormValues,
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

interface StockCountFormProps {
  onSubmit: (dto: CreateStockCountInput) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

export function StockCountForm({
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: StockCountFormProps) {
  const { t, i18n } = useTranslation('stockOps')
  const lang = i18n.language
  const locations = useLocations({ type: 'INTERNAL' })
  const items = useAllItems()

  const schema = useMemo(() => makeStockCountSchema(t), [t])

  const emptyLine = () => ({
    itemId: '',
    variantId: '',
    countedQty: undefined as unknown as number,
    unitCost: undefined as unknown as number,
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StockCountFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      locationId: '',
      countDate: today(),
      notes: '',
      lines: [emptyLine()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  const submit = (v: StockCountFormValues) => {
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const opt = (s: string | undefined) => s?.trim() || undefined
    onSubmit({
      locationId: v.locationId,
      countDate: v.countDate,
      notes: opt(v.notes),
      lines: v.lines.map((l) => ({
        itemId: l.itemId,
        variantId: opt(l.variantId),
        countedQty: l.countedQty,
        unitCost: num(l.unitCost),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="cnt-location"
          label={t('count.form.location')}
          placeholder={t('count.form.selectLocation')}
          options={(locations.data ?? []).map((l) => ({
            value: l.id,
            label: `${l.code} — ${localizedLocationName(l, lang)}`,
          }))}
          error={errors.locationId?.message}
          {...register('locationId')}
        />
        <TextField
          id="cnt-date"
          type="date"
          label={t('count.form.date')}
          error={errors.countDate?.message}
          {...register('countDate')}
        />
      </section>

      <TextareaField
        id="cnt-notes"
        label={t('form.notes')}
        {...register('notes')}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-label">{t('count.form.linesTitle')}</h2>
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
  control: Control<StockCountFormValues>
  register: UseFormRegister<StockCountFormValues>
  errors: FieldErrors<StockCountFormValues>
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
    <div className="grid items-start gap-3 rounded-lg border border-border p-3 md:grid-cols-[1.6fr_110px_110px_auto]">
      <SelectField
        id={`cnt-line-${index}-item`}
        label={t('count.form.line.item')}
        placeholder={t('count.form.line.selectItem')}
        options={items.map((i) => ({
          value: i.id,
          label: `${i.code} — ${localizedItemName(i, lang)}`,
        }))}
        error={lineErr?.itemId?.message}
        {...register(`lines.${index}.itemId`)}
      />
      <TextField
        id={`cnt-line-${index}-counted`}
        type="number"
        step="0.001"
        label={t('count.form.line.counted')}
        error={lineErr?.countedQty?.message}
        {...register(`lines.${index}.countedQty`, { valueAsNumber: true })}
      />
      <TextField
        id={`cnt-line-${index}-cost`}
        type="number"
        step="0.0001"
        label={t('count.form.line.unitCost')}
        error={lineErr?.unitCost?.message}
        {...register(`lines.${index}.unitCost`, { valueAsNumber: true })}
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
        <div className="md:col-span-4">
          <SelectField
            id={`cnt-line-${index}-variant`}
            label={t('count.form.line.variant')}
            placeholder={t('count.form.line.selectVariant')}
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
