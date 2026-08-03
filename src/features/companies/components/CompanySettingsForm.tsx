import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import { useUpdateCompanySettings } from '@/features/companies/hooks/useUpdateCompanySettings'
import { isPermissionDenied } from '@/features/auth/lib/permissions'
import {
  MONTHS,
  ROUNDING_MODES,
  makeSettingsSchema,
  monthName,
} from '@/features/companies/types/companies.types'
import type {
  CompanySettings,
  SettingsFormValues,
} from '@/features/companies/types/companies.types'
import { toast } from '@/lib/swal'

interface CompanySettingsFormProps {
  companyId: string
  settings: CompanySettings
  disabled?: boolean
}

/**
 * Company settings: base currency, fiscal year start and rounding.
 *
 * The first two are Company columns rather than settings-JSON keys, but the
 * endpoint accepts them (backend 967e995) so they belong on the settings
 * screen where people look for them. They're also editable from the company
 * Edit form — same underlying fields, two entry points.
 *
 * `enabledModules`, `featureFlags`, `fieldVisibility` and `defaultTemplates`
 * are accepted here too but have no documented set of valid keys, so there's
 * no UI for them. PATCH is partial, so they survive a save untouched.
 */
export function CompanySettingsForm({
  companyId,
  settings,
  disabled,
}: CompanySettingsFormProps) {
  const { t, i18n } = useTranslation('companies')
  const currencies = useCurrencies()
  const updateSettings = useUpdateCompanySettings()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeSettingsSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      baseCurrencyCode: settings.baseCurrencyCode,
      fiscalYearStartMonth: settings.fiscalYearStartMonth,
      roundingDecimals: settings.rounding?.decimals ?? 2,
      roundingMode: settings.rounding?.mode ?? 'HALF_UP',
    },
  })

  const onSubmit = (values: SettingsFormValues) => {
    setBanner(null)
    updateSettings.mutate(
      {
        id: companyId,
        dto: {
          baseCurrencyCode: values.baseCurrencyCode,
          fiscalYearStartMonth: values.fiscalYearStartMonth,
          rounding: {
            decimals: values.roundingDecimals,
            mode: values.roundingMode,
          },
        },
      },
      {
        onSuccess: () => toast('success', t('settings.saved')),
        onError: (err) =>
          setBanner(
            isPermissionDenied(err)
              ? t('errors.permissionDenied')
              : t('errors.generic')
          ),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="settings-baseCurrency"
          label={t('form.baseCurrency')}
          options={(currencies.data ?? []).map((c) => ({
            value: c.code,
            label: `${c.code} — ${c.name}`,
          }))}
          disabled={disabled}
          error={errors.baseCurrencyCode?.message}
          {...register('baseCurrencyCode')}
        />
        <SelectField
          id="settings-fiscalYearStart"
          label={t('form.fiscalYearStart')}
          options={MONTHS.map((m) => ({
            value: String(m),
            label: monthName(m, i18n.language),
          }))}
          disabled={disabled}
          error={errors.fiscalYearStartMonth?.message}
          {...register('fiscalYearStartMonth', { valueAsNumber: true })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="settings-roundingDecimals"
          type="number"
          label={t('form.roundingDecimals')}
          disabled={disabled}
          error={errors.roundingDecimals?.message}
          {...register('roundingDecimals', { valueAsNumber: true })}
        />
        <SelectField
          id="settings-roundingMode"
          label={t('form.roundingMode')}
          options={ROUNDING_MODES.map((m) => ({
            value: m,
            label: t(`roundingMode.${m}`),
          }))}
          disabled={disabled}
          error={errors.roundingMode?.message}
          {...register('roundingMode')}
        />
      </div>

      <p className="text-[13px] text-text-muted">{t('settings.note')}</p>

      {!disabled && (
        <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="animate-spin" />}
          {t('settings.save')}
        </Button>
      )}
    </form>
  )
}
