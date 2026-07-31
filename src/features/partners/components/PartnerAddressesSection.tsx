import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { makeAddressRow } from '@/features/partners/types/partners.types'
import type { PartnerFormValues } from '@/features/partners/types/partners.types'

const ADDRESS_TYPES = ['BILLING', 'SHIPPING', 'BRANCH'] as const

/**
 * §3.6 — repeatable address list. Split out of PartnerForm because
 * useFieldArray + the "only one default" enforcement is a self-contained
 * concern, same reasoning as splitting a complex form into focused
 * sub-components per docs/CONVENTIONS.md's styling-tiers note.
 */
export function PartnerAddressesSection() {
  const { t } = useTranslation('partners')
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<PartnerFormValues>()

  const { fields, append, remove } = useFieldArray({ control, name: 'addresses' })

  const typeOptions = ADDRESS_TYPES.map((value) => ({
    value,
    label: t(`form.addresses.type.${value}`),
  }))

  function markDefault(index: number, checked: boolean) {
    const current = getValues('addresses')
    current.forEach((_, i) => {
      setValue(`addresses.${i}.isDefault`, i === index ? checked : false, {
        shouldDirty: true,
      })
    })
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-text-muted">{t('form.addresses.empty')}</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-4 rounded-md border border-border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <SelectField
                id={`addresses.${index}.type`}
                label={t('form.addresses.typeLabel')}
                options={typeOptions}
                {...register(`addresses.${index}.type` as const)}
              />
              <TextField
                id={`addresses.${index}.line1`}
                label={t('form.addresses.line1')}
                error={errors.addresses?.[index]?.line1?.message}
                {...register(`addresses.${index}.line1` as const)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 text-danger hover:text-danger"
              onClick={() => remove(index)}
              aria-label={t('form.addresses.remove')}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              id={`addresses.${index}.city`}
              label={t('form.addresses.city')}
              {...register(`addresses.${index}.city` as const)}
            />
            <TextField
              id={`addresses.${index}.country`}
              label={t('form.addresses.country')}
              {...register(`addresses.${index}.country` as const)}
            />
            <TextField
              id={`addresses.${index}.region`}
              label={t('form.addresses.region')}
              {...register(`addresses.${index}.region` as const)}
            />
            <TextField
              id={`addresses.${index}.phone`}
              label={t('form.addresses.phone')}
              {...register(`addresses.${index}.phone` as const)}
            />
          </div>

          <Controller
            name={`addresses.${index}.isDefault`}
            control={control}
            render={({ field: checkboxField }) => (
              <CheckboxField
                id={`addresses.${index}.isDefault`}
                label={t('form.addresses.isDefault')}
                checked={checkboxField.value}
                onCheckedChange={(checked) => markDefault(index, checked === true)}
              />
            )}
          />
        </div>
      ))}

      {errors.addresses?.root?.message && (
        <p className="text-sm text-danger">{errors.addresses.root.message}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(makeAddressRow())}
      >
        <Plus className="size-4" />
        {t('form.addresses.add')}
      </Button>
    </div>
  )
}
