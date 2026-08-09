import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { TextareaField } from '@/components/common/TextareaField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { FormBanner } from '@/components/common/FormBanner'
import {
  useItemCategories,
  useBrands,
  useFamilies,
} from '@/features/catalog/hooks/useLookups'
import {
  localizedLookupName,
  type CatalogLookup,
} from '@/features/catalog/types/catalog.types'
import { useUoms } from '@/features/uom/hooks/useUoms'
import { localizedUomName } from '@/features/uom/types/uom.types'
import { useTaxRates } from '@/features/taxes/hooks/useTaxRates'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import { localizedAccountName } from '@/features/accounts/types/accounts.types'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useActiveCompanyBaseCurrency } from '@/features/companies/hooks/useActiveCompanyBaseCurrency'
import {
  TAX_TREATMENTS,
  makeItemSchema,
} from '@/features/items/types/items.types'
import type {
  CreateItemDto,
  Item,
  ItemFormValues,
} from '@/features/items/types/items.types'

interface ItemFormProps {
  /** Absent = create. Present = edit, and the form seeds from it. */
  item?: Item
  onSubmit: (dto: CreateItemDto) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

export function ItemForm({
  item,
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: ItemFormProps) {
  const { t, i18n } = useTranslation('items')
  const lang = i18n.language

  const categories = useItemCategories()
  const brands = useBrands()
  const families = useFamilies()
  const uoms = useUoms()
  const taxRates = useTaxRates()
  const accounts = useAllAccounts()
  const currencies = useCurrencies()
  const baseCurrency = useActiveCompanyBaseCurrency()

  const schema = useMemo(() => makeItemSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      code: item?.code ?? '',
      name: item?.name ?? '',
      nameAr: item?.nameAr ?? '',
      nameFr: item?.nameFr ?? '',
      nameEn: item?.nameEn ?? '',
      description: item?.description ?? '',
      categoryId: item?.categoryId ?? '',
      brandId: item?.brandId ?? '',
      familyId: item?.familyId ?? '',
      baseUomId: item?.baseUomId ?? '',
      salesUomId: item?.salesUomId ?? '',
      purchaseUomId: item?.purchaseUomId ?? '',
      costPrice: item?.costPrice ?? (undefined as unknown as number),
      salePrice: item?.salePrice ?? (undefined as unknown as number),
      priceCurrency: item?.priceCurrency ?? baseCurrency ?? '',
      vatTreatment: item?.vatTreatment ?? 'STANDARD',
      defaultTaxRateId: item?.defaultTaxRateId ?? '',
      hasSize: item?.hasSize ?? false,
      hasColour: item?.hasColour ?? false,
      trackSerial: item?.trackSerial ?? false,
      trackExpiry: item?.trackExpiry ?? false,
      trackInventory: item?.trackInventory ?? true,
      revenueAccountId: item?.revenueAccountId ?? '',
      cogsAccountId: item?.cogsAccountId ?? '',
      isActive: item?.isActive ?? true,
    },
  })

  const baseUomId = useWatch({ control, name: 'baseUomId' })

  // Sales/purchase UoMs must share the base unit's category (the backend
  // enforces it). Once a base is chosen, offer only compatible units.
  const baseCategoryId = uoms.data?.find((u) => u.id === baseUomId)?.categoryId
  const uomOptions = (uoms.data ?? []).map((u) => ({
    value: u.id,
    label: localizedUomName(u, lang),
  }))
  const compatibleUomOptions = baseCategoryId
    ? (uoms.data ?? [])
        .filter((u) => u.categoryId === baseCategoryId)
        .map((u) => ({ value: u.id, label: localizedUomName(u, lang) }))
    : uomOptions

  const lookupOptions = (list: CatalogLookup[]) =>
    list.map((l) => ({ value: l.id, label: localizedLookupName(l, lang) }))

  const accountOptions = (accounts.data ?? [])
    .filter((a) => a.isActive)
    .map((a) => ({
      value: a.id,
      label: `${a.number} — ${localizedAccountName(a, lang)}`,
    }))

  const submit = (v: ItemFormValues) => {
    const num = (n: number | undefined) =>
      typeof n === 'number' && Number.isFinite(n) ? n : undefined
    const opt = (s: string | undefined) => s?.trim() || undefined
    onSubmit({
      code: v.code.trim(),
      name: v.name.trim(),
      nameAr: opt(v.nameAr),
      nameFr: opt(v.nameFr),
      nameEn: opt(v.nameEn),
      description: opt(v.description),
      categoryId: opt(v.categoryId),
      brandId: opt(v.brandId),
      familyId: opt(v.familyId),
      baseUomId: v.baseUomId,
      salesUomId: opt(v.salesUomId),
      purchaseUomId: opt(v.purchaseUomId),
      costPrice: num(v.costPrice),
      salePrice: num(v.salePrice),
      priceCurrency: opt(v.priceCurrency),
      vatTreatment: v.vatTreatment,
      defaultTaxRateId: opt(v.defaultTaxRateId),
      hasSize: v.hasSize,
      hasColour: v.hasColour,
      trackSerial: v.trackSerial,
      trackExpiry: v.trackExpiry,
      trackInventory: v.trackInventory,
      revenueAccountId: opt(v.revenueAccountId),
      cogsAccountId: opt(v.cogsAccountId),
      isActive: v.isActive,
    })
  }

  const none = t('form.none')

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.identity')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="item-code"
            label={t('form.code')}
            error={errors.code?.message}
            {...register('code')}
          />
          <TextField
            id="item-name"
            label={t('form.name')}
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="item-nameAr"
            label={t('form.nameAr')}
            dir="rtl"
            {...register('nameAr')}
          />
          <TextField
            id="item-nameFr"
            label={t('form.nameFr')}
            {...register('nameFr')}
          />
          <TextField
            id="item-nameEn"
            label={t('form.nameEn')}
            {...register('nameEn')}
          />
        </div>
        <TextareaField
          id="item-description"
          label={t('form.description')}
          {...register('description')}
        />
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.classification')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            id="item-category"
            label={t('form.category')}
            placeholder={none}
            options={lookupOptions(categories.data ?? [])}
            {...register('categoryId')}
          />
          <SelectField
            id="item-brand"
            label={t('form.brand')}
            placeholder={none}
            options={lookupOptions(brands.data ?? [])}
            {...register('brandId')}
          />
          <SelectField
            id="item-family"
            label={t('form.family')}
            placeholder={none}
            options={lookupOptions(families.data ?? [])}
            {...register('familyId')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.units')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            id="item-baseUom"
            label={t('form.baseUom')}
            placeholder={t('form.selectUom')}
            options={uomOptions}
            error={errors.baseUomId?.message}
            {...register('baseUomId')}
          />
          <SelectField
            id="item-salesUom"
            label={t('form.salesUom')}
            placeholder={none}
            options={compatibleUomOptions}
            {...register('salesUomId')}
          />
          <SelectField
            id="item-purchaseUom"
            label={t('form.purchaseUom')}
            placeholder={none}
            options={compatibleUomOptions}
            {...register('purchaseUomId')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.pricing')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="item-costPrice"
            type="number"
            step="0.0001"
            label={t('form.costPrice')}
            error={errors.costPrice?.message}
            {...register('costPrice', { valueAsNumber: true })}
          />
          <TextField
            id="item-salePrice"
            type="number"
            step="0.0001"
            label={t('form.salePrice')}
            error={errors.salePrice?.message}
            {...register('salePrice', { valueAsNumber: true })}
          />
          <SelectField
            id="item-priceCurrency"
            label={t('form.priceCurrency')}
            options={(currencies.data ?? [])
              .filter((c) => c.isActive)
              .map((c) => ({ value: c.code, label: c.code }))}
            {...register('priceCurrency')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="item-vatTreatment"
            label={t('form.vatTreatment')}
            options={TAX_TREATMENTS.map((v) => ({
              value: v,
              label: t(`vatTreatment.${v}`),
            }))}
            {...register('vatTreatment')}
          />
          <SelectField
            id="item-defaultTaxRate"
            label={t('form.defaultTaxRate')}
            placeholder={none}
            options={(taxRates.data ?? []).map((r) => ({
              value: r.id,
              label: `${r.name} (${r.ratePct}%)`,
            }))}
            {...register('defaultTaxRateId')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.tracking')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxController
            control={control}
            name="trackInventory"
            label={t('form.trackInventory')}
            hint={t('form.trackInventoryHint')}
          />
          <CheckboxController
            control={control}
            name="hasSize"
            label={t('form.hasSize')}
          />
          <CheckboxController
            control={control}
            name="hasColour"
            label={t('form.hasColour')}
          />
          <CheckboxController
            control={control}
            name="trackSerial"
            label={t('form.trackSerial')}
          />
          <CheckboxController
            control={control}
            name="trackExpiry"
            label={t('form.trackExpiry')}
          />
          <CheckboxController
            control={control}
            name="isActive"
            label={t('form.isActive')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('detail.sections.accounting')}</h2>
        <p className="text-[13px] text-text-muted">{t('form.accountsHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="item-revenueAccount"
            label={t('form.revenueAccount')}
            placeholder={t('form.accountDefault')}
            options={accountOptions}
            {...register('revenueAccountId')}
          />
          <SelectField
            id="item-cogsAccount"
            label={t('form.cogsAccount')}
            placeholder={t('form.accountDefault')}
            options={accountOptions}
            {...register('cogsAccountId')}
          />
        </div>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}

/** A boolean form field. Radix Checkbox isn't a native input, so it goes
 *  through Controller rather than register() (same as CheckboxField's note). */
function CheckboxController({
  control,
  name,
  label,
  hint,
}: {
  control: Control<ItemFormValues>
  name:
    | 'hasSize'
    | 'hasColour'
    | 'trackSerial'
    | 'trackExpiry'
    | 'trackInventory'
    | 'isActive'
  label: string
  hint?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div>
          <CheckboxField
            id={`item-${name}`}
            label={label}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          {hint && <p className="mt-1 text-[13px] text-text-muted">{hint}</p>}
        </div>
      )}
    />
  )
}
