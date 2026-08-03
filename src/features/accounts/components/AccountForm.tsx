import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { SelectField } from '@/components/common/SelectField'
import { CheckboxField } from '@/components/common/CheckboxField'
import { FormBanner } from '@/components/common/FormBanner'
import { useAllAccounts } from '@/features/accounts/hooks/useAllAccounts'
import {
  ACCOUNT_TYPES,
  CONTROL_TYPES,
  NORMAL_BALANCES,
  localizedAccountName,
  makeAccountSchema,
} from '@/features/accounts/types/accounts.types'
import type {
  Account,
  AccountFormValues,
  CreateAccountDto,
} from '@/features/accounts/types/accounts.types'

interface AccountFormProps {
  /** Absent = create. Present = edit, and the form seeds from it. */
  account?: Account
  onSubmit: (dto: CreateAccountDto) => void
  isPending: boolean
  banner: string | null
  submitLabel: string
}

/**
 * Shared create/edit form.
 *
 * Normal balance is a real field rather than being derived from the type,
 * even though ASSET/EXPENSE are conventionally DEBIT and the rest CREDIT: the
 * backend accepts both independently, contra-accounts (accumulated
 * depreciation, sales returns) legitimately invert the convention, and quietly
 * overriding the user would make those impossible to express.
 */
export function AccountForm({
  account,
  onSubmit,
  isPending,
  banner,
  submitLabel,
}: AccountFormProps) {
  const { t, i18n } = useTranslation('accounts')
  const allAccounts = useAllAccounts()

  const schema = useMemo(() => makeAccountSchema(t), [t])
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      number: account?.number ?? '',
      name: account?.name ?? '',
      nameAr: account?.nameAr ?? '',
      nameFr: account?.nameFr ?? '',
      nameEn: account?.nameEn ?? '',
      accountClass: account?.accountClass ?? 1,
      type: account?.type ?? 'ASSET',
      normalBalance: account?.normalBalance ?? 'DEBIT',
      parentId: account?.parentId ?? '',
      currencyRestriction: account?.currencyRestriction ?? '',
      isControl: account?.isControl ?? false,
      controlType: account?.controlType ?? '',
    },
  })

  // `useWatch` rather than `watch()` — the latter returns a fresh function
  // each render that the React Compiler can't memoize, so it bails out of
  // optimising this whole component.
  const isControl = useWatch({ control, name: 'isControl' })

  // An account can't parent itself. Deeper cycles are rejected by the backend
  // (it validates the whole ancestor chain) — this only removes the one case
  // that's obvious enough to be confusing if offered.
  const parentOptions = (allAccounts.data ?? [])
    .filter((a) => a.id !== account?.id)
    .map((a) => ({
      value: a.id,
      label: `${a.number} — ${localizedAccountName(a, i18n.language)}`,
    }))

  const submit = (values: AccountFormValues) => {
    onSubmit({
      number: values.number.trim(),
      name: values.name.trim(),
      nameAr: values.nameAr?.trim() || undefined,
      nameFr: values.nameFr?.trim() || undefined,
      nameEn: values.nameEn?.trim() || undefined,
      accountClass: values.accountClass,
      type: values.type,
      normalBalance: values.normalBalance,
      parentId: values.parentId || undefined,
      currencyRestriction: values.currencyRestriction?.trim() || undefined,
      isControl: values.isControl,
      // Only meaningful when isControl — sending it otherwise is what the
      // backend's control-flag validation rejects.
      controlType: values.isControl
        ? (values.controlType as CreateAccountDto['controlType'])
        : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <section className="space-y-4">
        <h2 className="section-label">{t('form.sections.identity')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="account-number"
            label={t('form.number')}
            placeholder={t('form.numberPlaceholder')}
            error={errors.number?.message}
            {...register('number')}
          />
          <TextField
            id="account-class"
            type="number"
            label={t('form.accountClass')}
            error={errors.accountClass?.message}
            {...register('accountClass', { valueAsNumber: true })}
          />
        </div>
        <TextField
          id="account-name"
          label={t('form.name')}
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            id="account-nameAr"
            label={t('form.nameAr')}
            dir="rtl"
            error={errors.nameAr?.message}
            {...register('nameAr')}
          />
          <TextField
            id="account-nameFr"
            label={t('form.nameFr')}
            error={errors.nameFr?.message}
            {...register('nameFr')}
          />
          <TextField
            id="account-nameEn"
            label={t('form.nameEn')}
            error={errors.nameEn?.message}
            {...register('nameEn')}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('form.sections.classification')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="account-type"
            label={t('form.type')}
            options={ACCOUNT_TYPES.map((v) => ({
              value: v,
              label: t(`type.${v}`),
            }))}
            error={errors.type?.message}
            {...register('type')}
          />
          <SelectField
            id="account-normalBalance"
            label={t('form.normalBalance')}
            options={NORMAL_BALANCES.map((v) => ({
              value: v,
              label: t(`normalBalance.${v}`),
            }))}
            error={errors.normalBalance?.message}
            {...register('normalBalance')}
          />
        </div>
        <SelectField
          id="account-parent"
          label={t('form.parent')}
          placeholder={t('form.noParent')}
          options={parentOptions}
          error={errors.parentId?.message}
          {...register('parentId')}
        />
      </section>

      <section className="space-y-4">
        <h2 className="section-label">{t('form.sections.behaviour')}</h2>
        <TextField
          id="account-currency"
          label={t('form.currencyRestriction')}
          placeholder={t('form.currencyRestrictionPlaceholder')}
          error={errors.currencyRestriction?.message}
          {...register('currencyRestriction')}
        />

        {/* Radix Checkbox isn't a native input, so it goes through Controller
            rather than register() — same as CheckboxField's own note. */}
        <Controller
          control={control}
          name="isControl"
          render={({ field }) => (
            <CheckboxField
              id="account-isControl"
              label={t('form.isControl')}
              checked={field.value}
              onCheckedChange={field.onChange}
              error={errors.isControl?.message}
            />
          )}
        />

        {/* Only rendered when it applies — a disabled-but-visible control type
            on every non-control account is noise. */}
        {isControl && (
          <SelectField
            id="account-controlType"
            label={t('form.controlType')}
            placeholder={t('form.controlTypePlaceholder')}
            options={CONTROL_TYPES.map((v) => ({
              value: v,
              label: t(`controlType.${v}`),
            }))}
            error={errors.controlType?.message}
            {...register('controlType')}
          />
        )}
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
