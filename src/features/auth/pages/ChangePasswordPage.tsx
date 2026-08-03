import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PasswordField } from '@/components/common/PasswordField'
import { FormBanner } from '@/components/common/FormBanner'
import { useChangePassword } from '@/features/auth/hooks/useChangePassword'
import { completeAuth } from '@/features/auth/lib/complete-auth'
import { ApiException } from '@/types/api'

function makeSchema(t: TFunction<'auth'>) {
  return z
    .object({
      currentPassword: z.string().min(1, t('validation.required')),
      newPassword: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    })
}

type ChangePasswordForm = z.infer<ReturnType<typeof makeSchema>>

export function ChangePasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const changePassword = useChangePassword()
  const [banner, setBanner] = useState<string | null>(null)

  const schema = useMemo(() => makeSchema(t), [t])
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isValid },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    setFocus('currentPassword')
  }, [setFocus])

  const onSubmit = (values: ChangePasswordForm) => {
    setBanner(null)
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        // Response is a fresh AuthResponse (mustChangePassword now false);
        // completeAuth applies it and re-runs §2 — the user may still need
        // /select-company, so don't hardcode /app here.
        onSuccess: (auth) => completeAuth(auth, navigate),
        onError: (err) => {
          if (err instanceof ApiException) {
            if (err.code === 'AUTH_INVALID_CURRENT_PASSWORD') {
              setError('currentPassword', {
                message: t('changePassword.errors.invalidCurrent'),
              })
              setFocus('currentPassword')
              return
            }
            if (err.code === 'AUTH_PASSWORD_UNCHANGED') {
              setError('newPassword', {
                message: t('changePassword.errors.unchanged'),
              })
              setFocus('newPassword')
              return
            }
          }
          setBanner(t('changePassword.errors.generic'))
        },
      }
    )
  }

  return (
    <AuthLayout
      title={t('changePassword.title')}
      subtitle={t('changePassword.subtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {banner && <FormBanner variant="error">{banner}</FormBanner>}

        <PasswordField
          id="currentPassword"
          label={t('changePassword.currentPassword')}
          autoComplete="current-password"
          showLabel={t('login.showPassword')}
          hideLabel={t('login.hidePassword')}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          id="newPassword"
          label={t('changePassword.newPassword')}
          autoComplete="new-password"
          showLabel={t('login.showPassword')}
          hideLabel={t('login.hidePassword')}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          id="confirmPassword"
          label={t('changePassword.confirmPassword')}
          autoComplete="new-password"
          showLabel={t('login.showPassword')}
          hideLabel={t('login.hidePassword')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || changePassword.isPending}
        >
          {changePassword.isPending && <Loader2 className="animate-spin" />}
          {t('changePassword.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
