import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { SwitchField } from '@/components/common/SwitchField'
import { FormBanner } from '@/components/common/FormBanner'
import { AccountCombobox } from '@/features/partners/components/AccountCombobox'
import { PartnerAddressesSection } from '@/features/partners/components/PartnerAddressesSection'
import { useCurrencies } from '@/features/partners/hooks/useCurrencies'
import { useAccounts } from '@/features/partners/hooks/useAccounts'
import { useCreatePartner } from '@/features/partners/hooks/useCreatePartner'
import { useUpdatePartner } from '@/features/partners/hooks/useUpdatePartner'
import { makeAddressRow, makePartnerFormSchema } from '@/features/partners/types/partners.types'
import type {
  CreatePartnerDto,
  Partner,
  PartnerFormValues,
  UpdatePartnerDto,
} from '@/features/partners/types/partners.types'
import { ApiException } from '@/types/api'

function defaultValues(partner?: Partner): PartnerFormValues {
  if (!partner) {
    return {
      isCustomer: false,
      isSupplier: false,
      name: '',
      nameAr: '',
      nameFr: '',
      nameEn: '',
      ref: '',
      category: '',
      tin: '',
      contactName: '',
      phone: '',
      phone2: '',
      email: '',
      vip: false,
      creditLimit: '',
      creditCurrency: '',
      receivableAccountId: '',
      payableAccountId: '',
      addresses: [],
    }
  }
  return {
    isCustomer: partner.isCustomer,
    isSupplier: partner.isSupplier,
    name: partner.name,
    nameAr: partner.nameAr ?? '',
    nameFr: partner.nameFr ?? '',
    nameEn: partner.nameEn ?? '',
    ref: partner.ref,
    category: partner.category ?? '',
    tin: partner.tin ?? '',
    contactName: partner.contactName ?? '',
    phone: partner.phone ?? '',
    phone2: partner.phone2 ?? '',
    email: partner.email ?? '',
    vip: partner.vip,
    creditLimit: partner.creditLimit != null ? String(partner.creditLimit) : '',
    creditCurrency: partner.creditCurrency ?? '',
    receivableAccountId: partner.receivableAccountId ?? '',
    payableAccountId: partner.payableAccountId ?? '',
    addresses: (partner.addresses ?? []).map((a) =>
      makeAddressRow({
        type: a.type,
        line1: a.line1,
        city: a.city ?? '',
        country: a.country ?? '',
        region: a.region ?? '',
        phone: a.phone ?? '',
        isDefault: a.isDefault,
      })
    ),
  }
}

const emptyToUndefined = (v?: string) => (v && v.trim() ? v.trim() : undefined)

function buildDto(values: PartnerFormValues): CreatePartnerDto {
  return {
    ref: emptyToUndefined(values.ref),
    name: values.name.trim(),
    nameAr: emptyToUndefined(values.nameAr),
    nameFr: emptyToUndefined(values.nameFr),
    nameEn: emptyToUndefined(values.nameEn),
    isCustomer: values.isCustomer,
    isSupplier: values.isSupplier,
    category: emptyToUndefined(values.category),
    tin: emptyToUndefined(values.tin),
    contactName: emptyToUndefined(values.contactName),
    phone: emptyToUndefined(values.phone),
    phone2: emptyToUndefined(values.phone2),
    email: emptyToUndefined(values.email),
    vip: values.vip,
    creditLimit:
      values.creditLimit && values.creditLimit.trim() ? Number(values.creditLimit) : undefined,
    creditCurrency: emptyToUndefined(values.creditCurrency),
    receivableAccountId: emptyToUndefined(values.receivableAccountId),
    payableAccountId: emptyToUndefined(values.payableAccountId),
    addresses: values.addresses.map((a) => ({
      type: a.type,
      line1: a.line1.trim(),
      city: emptyToUndefined(a.city),
      country: emptyToUndefined(a.country),
      region: emptyToUndefined(a.region),
      phone: emptyToUndefined(a.phone),
      isDefault: a.isDefault,
    })),
  }
}

interface PartnerFormProps {
  partner?: Partner
  onSuccess: (partner: Partner) => void
}

/**
 * Shared create/edit form (§3) — one component, two thin page wrappers.
 * Sections are ordered by progressive disclosure: Role first (everything
 * else depends on it), Advanced collapsed by default since most users never
 * touch AR/AP overrides (the backend defaults them server-side).
 */
export function PartnerForm({ partner, onSuccess }: PartnerFormProps) {
  const { t } = useTranslation('partners')
  const [banner, setBanner] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const currencies = useCurrencies()
  const accounts = useAccounts()
  const create = useCreatePartner()
  const update = useUpdatePartner()
  const isPending = create.isPending || update.isPending

  const schema = useMemo(() => makePartnerFormSchema(t), [t])
  const methods = useForm<PartnerFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: defaultValues(partner),
  })
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = methods

  const currencyOptions = (currencies.data ?? []).map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name}`,
  }))
  const accountOptions = (accounts.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.number} — ${a.name}`,
  }))

  const onSubmit = (values: PartnerFormValues) => {
    setBanner(null)
    const dto = buildDto(values)

    const onError = (err: unknown) => {
      if (err instanceof ApiException) {
        switch (err.code) {
          case 'PARTNER_ROLE_REQUIRED':
            setError('isCustomer', { message: t('validation.roleRequired') })
            return
          case 'PARTNER_REF_ALREADY_EXISTS':
            setError('ref', { message: t('errors.refAlreadyExists') })
            return
          case 'PARTNER_REF_GENERATION_FAILED':
            setBanner(t('errors.refGenerationFailed'))
            return
        }
      }
      setBanner(t('errors.generic'))
    }

    if (partner) {
      const patch: UpdatePartnerDto = dto
      update.mutate(
        { id: partner.id, dto: patch },
        { onSuccess, onError }
      )
    } else {
      create.mutate(dto, { onSuccess, onError })
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <Section title={t('form.sections.role')}>
          <div className="flex flex-wrap gap-6">
            <Controller
              name="isCustomer"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  id="isCustomer"
                  label={t('form.customer')}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Controller
              name="isSupplier"
              control={control}
              render={({ field }) => (
                <CheckboxField
                  id="isSupplier"
                  label={t('form.supplier')}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
          </div>
          {errors.isCustomer?.message && (
            <p className="text-sm text-danger">{errors.isCustomer.message}</p>
          )}
        </Section>

        <Section title={t('form.sections.identity')}>
          <TextField
            id="name"
            label={t('form.name')}
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="ref"
              label={t('form.ref')}
              placeholder={t('form.refPlaceholder')}
              error={errors.ref?.message}
              {...register('ref')}
            />
            <TextField
              id="category"
              label={t('form.category')}
              error={errors.category?.message}
              {...register('category')}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-text-secondary">
              {t('form.translationsHeading')}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id="nameAr"
                label={t('form.nameAr')}
                dir="rtl"
                error={errors.nameAr?.message}
                {...register('nameAr')}
              />
              <TextField
                id="nameFr"
                label={t('form.nameFr')}
                error={errors.nameFr?.message}
                {...register('nameFr')}
              />
              <TextField
                id="nameEn"
                label={t('form.nameEn')}
                error={errors.nameEn?.message}
                {...register('nameEn')}
              />
            </div>
          </div>
        </Section>

        <Section title={t('form.sections.contact')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="contactName"
              label={t('form.contactName')}
              error={errors.contactName?.message}
              {...register('contactName')}
            />
            <TextField
              id="email"
              type="email"
              label={t('form.email')}
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              id="phone"
              type="tel"
              label={t('form.phone')}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <TextField
              id="phone2"
              type="tel"
              label={t('form.phone2')}
              error={errors.phone2?.message}
              {...register('phone2')}
            />
          </div>
        </Section>

        <Section title={t('form.sections.financial')}>
          <Controller
            name="vip"
            control={control}
            render={({ field }) => (
              <SwitchField
                id="vip"
                label={t('form.vip')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="creditLimit"
              inputMode="decimal"
              label={t('form.creditLimit')}
              error={errors.creditLimit?.message}
              {...register('creditLimit')}
            />
            <SelectField
              id="creditCurrency"
              label={t('form.creditCurrency')}
              placeholder={t('form.creditCurrencyPlaceholder')}
              options={currencyOptions}
              error={errors.creditCurrency?.message}
              {...register('creditCurrency')}
            />
          </div>
        </Section>

        <Section title={t('form.sections.advanced')}>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
            aria-expanded={advancedOpen}
          >
            <ChevronDown
              className={`size-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            />
            {advancedOpen ? t('form.advancedHide') : t('form.advancedShow')}
          </button>
          {advancedOpen && (
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <Controller
                name="receivableAccountId"
                control={control}
                render={({ field }) => (
                  <AccountCombobox
                    id="receivableAccountId"
                    label={t('form.receivableAccount')}
                    placeholder={t('form.accountPlaceholder')}
                    searchPlaceholder={t('form.accountSearchPlaceholder')}
                    emptyText={t('form.accountEmpty')}
                    clearLabel={t('form.accountClear')}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={accountOptions}
                    isLoading={accounts.isLoading}
                  />
                )}
              />
              <Controller
                name="payableAccountId"
                control={control}
                render={({ field }) => (
                  <AccountCombobox
                    id="payableAccountId"
                    label={t('form.payableAccount')}
                    placeholder={t('form.accountPlaceholder')}
                    searchPlaceholder={t('form.accountSearchPlaceholder')}
                    emptyText={t('form.accountEmpty')}
                    clearLabel={t('form.accountClear')}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={accountOptions}
                    isLoading={accounts.isLoading}
                  />
                )}
              />
            </div>
          )}
        </Section>

        <Section title={t('form.sections.addresses')}>
          <PartnerAddressesSection />
        </Section>

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {partner ? t('form.submitEdit') : t('form.submitCreate')}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  )
}
