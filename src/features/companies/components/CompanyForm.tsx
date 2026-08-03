import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import {
  MONTHS,
  makeCompanySchema,
  monthName,
} from '@/features/companies/types/companies.types'
import type {
  Company,
  CompanyFormValues,
  CreateCompanyDto,
} from '@/features/companies/types/companies.types'

interface CompanyFormProps {
  company?: Company
  onSubmit: (dto: CreateCompanyDto) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

/**
 * Shared create/edit form for a company.
 *
 * Base currency is a picker over the real currency registry rather than a text
 * field: it's a foreign key the backend validates, and a typo here would be
 * discovered much later as unlabelled or mis-scaled money on every financial
 * screen.
 *
 * Changing it after posting is allowed. Presentation currency and functional
 * currency are different things — translating the books for display is a
 * normal operation, not corruption. What's missing is the conversion, not a
 * prohibition: see docs/DEFERRED.md → D-004.
 */
export function CompanyForm({
  company,
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: CompanyFormProps) {
  const { t, i18n } = useTranslation('companies')
  const currencies = useCurrencies()

  const schema = useMemo(() => makeCompanySchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      name: company?.name ?? '',
      taxNumber: company?.taxNumber ?? '',
      phone: company?.phone ?? '',
      email: company?.email ?? '',
      baseCurrencyCode: company?.baseCurrencyCode ?? '',
      fiscalYearStartMonth: company?.fiscalYearStartMonth ?? 1,
    },
  })

  const currencyOptions = (currencies.data ?? []).map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name}`,
  }))

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          name: values.name.trim(),
          taxNumber: values.taxNumber?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          email: values.email?.trim() || undefined,
          baseCurrencyCode: values.baseCurrencyCode,
          fiscalYearStartMonth: values.fiscalYearStartMonth,
        })
      )}
      className="space-y-6"
      noValidate
    >
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="space-y-4">
        <h2 className="section-label">{t('form.sections.identity')}</h2>
        <TextField
          id="company-name"
          label={t('form.name')}
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="company-taxNumber"
            label={t('form.taxNumber')}
            error={errors.taxNumber?.message}
            {...register('taxNumber')}
          />
          <TextField
            id="company-phone"
            type="tel"
            label={t('form.phone')}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <TextField
          id="company-email"
          type="email"
          label={t('form.email')}
          error={errors.email?.message}
          {...register('email')}
        />
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('form.sections.accounting')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="company-baseCurrency"
            label={t('form.baseCurrency')}
            placeholder={t('form.baseCurrencyPlaceholder')}
            options={currencyOptions}
            error={errors.baseCurrencyCode?.message}
            {...register('baseCurrencyCode')}
          />
          <SelectField
            id="company-fiscalYearStart"
            label={t('form.fiscalYearStart')}
            options={MONTHS.map((m) => ({
              value: String(m),
              label: monthName(m, i18n.language),
            }))}
            error={errors.fiscalYearStartMonth?.message}
            {...register('fiscalYearStartMonth', { valueAsNumber: true })}
          />
        </div>
        <p className="text-[13px] text-text-muted">{t('form.accountingNote')}</p>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
