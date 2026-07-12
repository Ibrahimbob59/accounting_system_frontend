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
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword'
import { useResetPassword } from '@/features/auth/hooks/useResetPassword'
import { ApiException } from '@/types/api'

const RESEND_COOLDOWN_SECONDS = 30

function makeRequestSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
  })
}

function makeResetSchema(t: TFunction<'auth'>) {
  return z
    .object({
      code: z.string().regex(/^\d{6}$/, t('validation.codeLength')),
      newPassword: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    })
}

type RequestForm = z.infer<ReturnType<typeof makeRequestSchema>>
type ResetForm = z.infer<ReturnType<typeof makeResetSchema>>

type Banner = { variant: 'error' | 'success'; message: string } | null

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const forgot = useForgotPassword()
  const reset = useResetPassword()

  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [banner, setBanner] = useState<Banner>(null)
  const [locked, setLocked] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [done, setDone] = useState(false)

  const requestSchema = useMemo(() => makeRequestSchema(t), [t])
  const resetSchema = useMemo(() => makeResetSchema(t), [t])

  const {
    register: registerReq,
    handleSubmit: handleReq,
    setFocus: setFocusReq,
    formState: { errors: errReq, isValid: validReq },
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  })

  const {
    register: registerRes,
    handleSubmit: handleRes,
    setError: setErrorRes,
    setFocus: setFocusRes,
    formState: { errors: errRes, isValid: validRes },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  })

  // Autofocus the relevant first field for each step.
  useEffect(() => {
    if (step === 'request') setFocusReq('email')
  }, [step, setFocusReq])
  useEffect(() => {
    if (step === 'reset') setFocusRes('code')
  }, [step, setFocusRes])

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const goToResetStep = (submittedEmail: string) => {
    setEmail(submittedEmail)
    setStep('reset')
    setLocked(false)
    setCooldown(RESEND_COOLDOWN_SECONDS)
    setBanner({ variant: 'success', message: t('forgotPassword.codeSent') })
  }

  const onRequest = (values: RequestForm) => {
    setBanner(null)
    forgot.mutate(
      { email: values.email },
      {
        // The backend always returns the same generic success — move on
        // regardless of response content.
        onSuccess: () => goToResetStep(values.email),
        onError: () =>
          setBanner({
            variant: 'error',
            message: t('forgotPassword.errors.generic'),
          }),
      }
    )
  }

  const onResend = () => {
    if (cooldown > 0 || forgot.isPending) return
    forgot.mutate(
      { email },
      {
        onSuccess: () => {
          setLocked(false)
          setCooldown(RESEND_COOLDOWN_SECONDS)
          setBanner({
            variant: 'success',
            message: t('forgotPassword.codeSent'),
          })
        },
        onError: () =>
          setBanner({
            variant: 'error',
            message: t('forgotPassword.errors.generic'),
          }),
      }
    )
  }

  const onReset = (values: ResetForm) => {
    setBanner(null)
    reset.mutate(
      { email, code: values.code, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setDone(true)
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        },
        onError: (err) => {
          if (err instanceof ApiException) {
            if (err.code === 'AUTH_INVALID_RESET_CODE') {
              setErrorRes('code', {
                message: t('forgotPassword.errors.invalidCode'),
              })
              setFocusRes('code')
              return
            }
            if (err.code === 'AUTH_TOO_MANY_ATTEMPTS') {
              setLocked(true)
              setBanner({
                variant: 'error',
                message: t('forgotPassword.errors.tooManyAttempts'),
              })
              return
            }
          }
          setBanner({
            variant: 'error',
            message: t('forgotPassword.errors.generic'),
          })
        },
      }
    )
  }

  if (done) {
    return (
      <AuthLayout title={t('forgotPassword.title')}>
        <div className="space-y-6">
          <FormBanner variant="success">
            {t('forgotPassword.success')}
          </FormBanner>
          <Link
            to="/login"
            className="block text-center text-sm text-primary-700 hover:underline"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={t('forgotPassword.title')}
      subtitle={
        step === 'request'
          ? t('forgotPassword.subtitleRequest')
          : t('forgotPassword.subtitleReset')
      }
    >
      {step === 'request' ? (
        <form onSubmit={handleReq(onRequest)} className="space-y-5" noValidate>
          {banner && (
            <FormBanner variant={banner.variant}>{banner.message}</FormBanner>
          )}
          <TextField
            id="email"
            type="email"
            label={t('forgotPassword.email')}
            placeholder={t('login.emailPlaceholder')}
            autoComplete="email"
            error={errReq.email?.message}
            {...registerReq('email')}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={!validReq || forgot.isPending}
          >
            {forgot.isPending && <Loader2 className="animate-spin" />}
            {t('forgotPassword.sendCode')}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            <Link to="/login" className="text-primary-700 hover:underline">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRes(onReset)} className="space-y-5" noValidate>
          {banner && (
            <FormBanner variant={banner.variant}>{banner.message}</FormBanner>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{email}</span>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-primary-700 hover:underline"
            >
              {t('forgotPassword.editEmail')}
            </button>
          </div>

          <TextField
            id="code"
            inputMode="numeric"
            maxLength={6}
            label={t('forgotPassword.code')}
            autoComplete="one-time-code"
            disabled={locked}
            error={errRes.code?.message}
            {...registerRes('code')}
          />
          <PasswordField
            id="newPassword"
            label={t('forgotPassword.newPassword')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            disabled={locked}
            error={errRes.newPassword?.message}
            {...registerRes('newPassword')}
          />
          <PasswordField
            id="confirmNewPassword"
            label={t('forgotPassword.confirmPassword')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            disabled={locked}
            error={errRes.confirmPassword?.message}
            {...registerRes('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={locked || !validRes || reset.isPending}
          >
            {reset.isPending && <Loader2 className="animate-spin" />}
            {t('forgotPassword.submit')}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || forgot.isPending}
              className="text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:no-underline"
            >
              {cooldown > 0
                ? t('forgotPassword.resendIn', { seconds: cooldown })
                : t('forgotPassword.resend')}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
