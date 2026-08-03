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
import { useLogin } from '@/features/auth/hooks/useLogin'
import { completeAuth } from '@/features/auth/lib/complete-auth'
import { ApiException } from '@/types/api'

function makeSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordMin')),
  })
}

type LoginForm = z.infer<ReturnType<typeof makeSchema>>

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const login = useLogin()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeSchema(t), [t])
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    setFocus('email')
  }, [setFocus])

  const onSubmit = (values: LoginForm) => {
    setBanner(null)
    login.mutate(values, {
      onSuccess: (tokens) => completeAuth(tokens, navigate),
      onError: (err) => {
        if (
          err instanceof ApiException &&
          err.code === 'AUTH_INVALID_CREDENTIALS'
        ) {
          setBanner(t('login.errors.invalidCredentials'))
        } else {
          setBanner(t('login.errors.generic'))
        }
      },
    })
  }

  return (
    <AuthLayout title={t('login.title')} subtitle={t('login.subtitle')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <TextField
          id="email"
          type="email"
          label={t('login.email')}
          placeholder={t('login.emailPlaceholder')}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <PasswordField
            id="password"
            label={t('login.password')}
            autoComplete="current-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="text-end">
            <Link
              to="/forgot-password"
              className="text-sm text-brand hover:underline"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || login.isPending}
        >
          {login.isPending && <Loader2 className="animate-spin" />}
          {t('login.submit')}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-brand hover:underline">
            {t('login.createOne')}
          </Link>
        </p>

        {/* Secondary — visitors evaluating the product. Deliberately quieter
            than the login form itself. */}
        <p className="text-center text-xs text-text-muted">
          {t('login.interestedPrefix')}{' '}
          <Link to="/#demo-form" className="text-brand hover:underline">
            {t('login.requestDemo')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
