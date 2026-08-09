import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/common/Modal'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  useCreateUom,
  useUpdateUom,
} from '@/features/uom/hooks/useUomMutations'
import { uomErrorMessage } from '@/features/uom/lib/uom-errors'
import { UOM_TYPES, type Uom } from '@/features/uom/types/uom.types'
import { toast } from '@/lib/swal'

export function UomFormModal({
  categoryId,
  uom,
  open,
  onOpenChange,
}: {
  categoryId: string
  uom?: Uom
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('uom')
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={uom ? t('unit.editTitle') : t('unit.createTitle')}
    >
      {open && (
        <Body
          key={uom?.id ?? 'new'}
          categoryId={categoryId}
          uom={uom}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  )
}

function Body({
  categoryId,
  uom,
  onDone,
}: {
  categoryId: string
  uom?: Uom
  onDone: () => void
}) {
  const { t } = useTranslation('uom')
  const createUom = useCreateUom()
  const updateUom = useUpdateUom()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = z
    .object({
      name: z.string().min(1, t('validation.required')),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      nameEn: z.string().optional(),
      type: z.enum(UOM_TYPES),
      factor: z
        .number({ message: t('validation.factorPositive') })
        .positive(t('validation.factorPositive'))
        .optional()
        .or(z.nan()),
      rounding: z
        .number({ message: t('validation.roundingPositive') })
        .positive(t('validation.roundingPositive'))
        .optional()
        .or(z.nan()),
      isActive: z.boolean(),
    })
    // A non-reference unit must carry a factor; REFERENCE is forced to 1.
    .refine(
      (v) =>
        v.type === 'REFERENCE' ||
        (typeof v.factor === 'number' && Number.isFinite(v.factor)),
      { message: t('validation.factorRequired'), path: ['factor'] }
    )
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: uom?.name ?? '',
      nameAr: uom?.nameAr ?? '',
      nameFr: uom?.nameFr ?? '',
      nameEn: uom?.nameEn ?? '',
      type: uom?.type ?? 'REFERENCE',
      factor: uom?.factor ?? (undefined as unknown as number),
      rounding: uom?.rounding ?? (undefined as unknown as number),
      isActive: uom?.isActive ?? true,
    },
  })

  const type = useWatch({ control, name: 'type' })
  const isReference = type === 'REFERENCE'
  const isPending = createUom.isPending || updateUom.isPending

  const submit = (v: Values) => {
    setBanner(null)
    const opt = (s: string | undefined) => s?.trim() || undefined
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const input = {
      categoryId,
      name: v.name.trim(),
      nameAr: opt(v.nameAr),
      nameFr: opt(v.nameFr),
      nameEn: opt(v.nameEn),
      type: v.type,
      // REFERENCE is forced to factor 1 server-side; only send a factor otherwise.
      factor: v.type === 'REFERENCE' ? undefined : num(v.factor),
      rounding: num(v.rounding),
      isActive: v.isActive,
    }
    const onError = (err: unknown) => setBanner(uomErrorMessage(err, t))
    const onSuccess = () => {
      toast('success', uom ? t('saved') : t('created'))
      onDone()
    }
    if (uom) {
      updateUom.mutate({ id: uom.id, input }, { onSuccess, onError })
    } else {
      createUom.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <TextField
        id="uom-name"
        label={t('unit.name')}
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id="uom-nameAr"
          label={t('unit.nameAr')}
          dir="rtl"
          {...register('nameAr')}
        />
        <TextField
          id="uom-nameFr"
          label={t('unit.nameFr')}
          {...register('nameFr')}
        />
        <TextField
          id="uom-nameEn"
          label={t('unit.nameEn')}
          {...register('nameEn')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id="uom-type"
          label={t('unit.type')}
          options={UOM_TYPES.map((v) => ({ value: v, label: t(`type.${v}`) }))}
          {...register('type')}
        />
        <TextField
          id="uom-factor"
          type="number"
          step="0.000001"
          label={t('unit.factor')}
          placeholder={isReference ? t('unit.factorReference') : undefined}
          disabled={isReference}
          error={errors.factor?.message}
          {...register('factor', { valueAsNumber: true })}
        />
        <TextField
          id="uom-rounding"
          type="number"
          step="0.000001"
          label={t('unit.rounding')}
          placeholder={t('unit.roundingPlaceholder')}
          error={errors.rounding?.message}
          {...register('rounding', { valueAsNumber: true })}
        />
      </div>

      <p className="text-[13px] text-text-muted">{t('unit.factorHint')}</p>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <CheckboxField
            id="uom-isActive"
            label={t('unit.isActive')}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {t('form.save')}
        </Button>
      </div>
    </form>
  )
}
