import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TextField } from '@/components/common/TextField'
import { TextareaField } from '@/components/common/TextareaField'
import { SelectField } from '@/components/common/SelectField'
import { FormBanner } from '@/components/common/FormBanner'
import { useSubmitDemoRequest } from '@/features/leads/hooks/useSubmitDemoRequest'
import {
  COMPANY_SIZES,
  makeDemoRequestSchema,
} from '@/features/leads/types/leads.types'
import type {
  DemoRequestBody,
  DemoRequestForm as DemoRequestFormValues,
} from '@/features/leads/types/leads.types'

const emptyToUndefined = (v?: string) => (v && v.trim() ? v.trim() : undefined)

/**
 * The demo-request lead form. On success it swaps itself for an inline
 * confirmation state (the same two-state-on-one-page pattern as Forgot
 * Password), rather than navigating away. No autofocus: it lives inside a
 * scrolling marketing page, where grabbing focus on mount would yank the view.
 */
export function DemoRequestForm() {
  const { t } = useTranslation('leads')
  const submit = useSubmitDemoRequest()
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeDemoRequestSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoRequestFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      workEmail: '',
      companyName: '',
      phone: '',
      companySize: '',
      message: '',
    },
  })

  const sizeOptions = COMPANY_SIZES.map((value) => ({
    value,
    label: t(`companySize.${value}`),
  }))

  const onSubmit = (values: DemoRequestFormValues) => {
    setBanner(null)
    const body: DemoRequestBody = {
      fullName: values.fullName.trim(),
      workEmail: values.workEmail.trim(),
      companyName: values.companyName.trim(),
      phone: emptyToUndefined(values.phone),
      companySize: emptyToUndefined(values.companySize),
      message: emptyToUndefined(values.message),
    }
    submit.mutate(body, {
      onSuccess: () => setSubmitted(true),
      onError: () => setBanner(t('errors.generic')),
    })
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          {t('success.title')}
        </h3>
        <p className="mt-2 text-text-secondary">{t('success.body')}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8"
      noValidate
    >
      {banner && <FormBanner variant="error">{banner}</FormBanner>}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="demo-fullName"
          label={t('form.fullName')}
          placeholder={t('form.fullNamePlaceholder')}
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <TextField
          id="demo-workEmail"
          type="email"
          label={t('form.workEmail')}
          placeholder={t('form.workEmailPlaceholder')}
          autoComplete="email"
          error={errors.workEmail?.message}
          {...register('workEmail')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="demo-companyName"
          label={t('form.companyName')}
          autoComplete="organization"
          error={errors.companyName?.message}
          {...register('companyName')}
        />
        <TextField
          id="demo-phone"
          type="tel"
          label={t('form.phone')}
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <SelectField
        id="demo-companySize"
        label={t('form.companySize')}
        placeholder={t('form.companySizePlaceholder')}
        options={sizeOptions}
        error={errors.companySize?.message}
        {...register('companySize')}
      />

      <TextareaField
        id="demo-message"
        label={t('form.message')}
        placeholder={t('form.messagePlaceholder')}
        rows={4}
        error={errors.message?.message}
        {...register('message')}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submit.isPending}
      >
        {submit.isPending && <Loader2 className="animate-spin" />}
        {t('form.submit')}
      </Button>
    </form>
  )
}
