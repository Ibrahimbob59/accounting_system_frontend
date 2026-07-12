import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { TextField } from '@/components/common/TextField'
import { PasswordField } from '@/components/common/PasswordField'
import { FormBanner } from '@/components/common/FormBanner'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { completeAuth } from '@/features/auth/lib/complete-auth'
import { ApiException } from '@/types/api'
import type { RegisterRequest } from '@/features/auth/types/auth.types'

function makeSchema(t: TFunction<'auth'>) {
  const optionalText = z.string().trim().optional()
  return z
    .object({
      company: z.object({
        name: z.string().min(1, t('validation.required')),
        taxNumber: optionalText,
        phone: optionalText,
        email: z
          .union([z.literal(''), z.email(t('validation.emailInvalid'))])
          .optional(),
      }),
      user: z.object({
        firstName: z.string().min(1, t('validation.required')),
        lastName: z.string().min(1, t('validation.required')),
        email: z
          .string()
          .min(1, t('validation.required'))
          .email(t('validation.emailInvalid')),
        password: z.string().min(8, t('validation.passwordMin')),
        phone: optionalText,
      }),
      confirmPassword: z.string(),
    })
    .refine((d) => d.user.password === d.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    })
}

type RegisterForm = z.infer<ReturnType<typeof makeSchema>>

const emptyToUndefined = (v?: string) => (v && v.trim() ? v.trim() : undefined)

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeSchema(t), [t])
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      company: { name: '', taxNumber: '', phone: '', email: '' },
      user: { firstName: '', lastName: '', email: '', password: '', phone: '' },
      confirmPassword: '',
    },
  })

  useEffect(() => {
    setFocus('company.name')
  }, [setFocus])

  const onSubmit = (values: RegisterForm) => {
    setBanner(null)
    const body: RegisterRequest = {
      company: {
        name: values.company.name.trim(),
        taxNumber: emptyToUndefined(values.company.taxNumber),
        phone: emptyToUndefined(values.company.phone),
        email: emptyToUndefined(values.company.email),
      },
      user: {
        firstName: values.user.firstName.trim(),
        lastName: values.user.lastName.trim(),
        email: values.user.email.trim(),
        password: values.user.password,
        phone: emptyToUndefined(values.user.phone),
      },
    }

    registerMutation.mutate(body, {
      onSuccess: (tokens) => completeAuth(tokens, navigate),
      onError: (err) => {
        if (err instanceof ApiException) {
          if (err.code === 'USER_EMAIL_ALREADY_EXISTS') {
            setError('user.email', {
              message: t('register.errors.emailExists'),
            })
            setFocus('user.email')
            return
          }
          if (err.code === 'COMPANY_TAX_NUMBER_ALREADY_EXISTS') {
            setError('company.taxNumber', {
              message: t('register.errors.taxNumberExists'),
            })
            setFocus('company.taxNumber')
            return
          }
        }
        setBanner(t('register.errors.generic'))
      },
    })
  }

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      wide
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        {/* Company section */}
        <section className="space-y-4">
          <h2 className="ledger-rule field-label">
            {t('register.companySection')}
          </h2>
          <TextField
            id="company-name"
            label={t('register.companyName')}
            error={errors.company?.name?.message}
            {...register('company.name')}
          />
          <TextField
            id="company-taxNumber"
            label={t('register.taxNumber')}
            error={errors.company?.taxNumber?.message}
            {...register('company.taxNumber')}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="company-phone"
              label={t('register.phone')}
              error={errors.company?.phone?.message}
              {...register('company.phone')}
            />
            <TextField
              id="company-email"
              type="email"
              label={t('register.companyEmail')}
              error={errors.company?.email?.message}
              {...register('company.email')}
            />
          </div>
        </section>

        {/* Account section */}
        <section className="space-y-4">
          <h2 className="ledger-rule field-label">
            {t('register.accountSection')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="user-firstName"
              label={t('register.firstName')}
              autoComplete="given-name"
              error={errors.user?.firstName?.message}
              {...register('user.firstName')}
            />
            <TextField
              id="user-lastName"
              label={t('register.lastName')}
              autoComplete="family-name"
              error={errors.user?.lastName?.message}
              {...register('user.lastName')}
            />
          </div>
          <TextField
            id="user-email"
            type="email"
            label={t('register.email')}
            autoComplete="email"
            error={errors.user?.email?.message}
            {...register('user.email')}
          />
          <PasswordField
            id="user-password"
            label={t('register.password')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            error={errors.user?.password?.message}
            {...register('user.password')}
          />
          <PasswordField
            id="confirmPassword"
            label={t('register.confirmPassword')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </section>

        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || registerMutation.isPending}
        >
          {registerMutation.isPending && <Loader2 className="animate-spin" />}
          {t('register.submit')}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-primary-700 hover:underline">
            {t('register.login')}
          </Link>
        </p>

        <p className="text-center text-xs text-text-muted">
          {t('register.privacyNotice')}{' '}
          <Link
            to="/privacy-policy"
            className="text-primary-700 hover:underline"
          >
            {t('register.privacyPolicyLink')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
