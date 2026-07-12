import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Info, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { TextField } from '@/components/common/TextField'
import { PasswordField } from '@/components/common/PasswordField'
import { FormBanner } from '@/components/common/FormBanner'
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword'
import { useVerifyResetCode } from '@/features/auth/hooks/useVerifyResetCode'
import { useResetPassword } from '@/features/auth/hooks/useResetPassword'
import { ApiException } from '@/types/api'
import { toast } from '@/lib/swal'

const RESEND_COOLDOWN_SECONDS = 30

function makeRequestSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
  })
}

function makeCodeSchema(t: TFunction<'auth'>) {
  return z.object({
    code: z.string().regex(/^\d{6}$/, t('validation.codeLength')),
  })
}

function makePasswordSchema(t: TFunction<'auth'>) {
  return z
    .object({
      newPassword: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('validation.passwordsMustMatch'),
      path: ['confirmPassword'],
    })
}

type RequestForm = z.infer<ReturnType<typeof makeRequestSchema>>
type CodeForm = z.infer<ReturnType<typeof makeCodeSchema>>
type PasswordForm = z.infer<ReturnType<typeof makePasswordSchema>>

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const forgot = useForgotPassword()
  const verifyCode = useVerifyResetCode()
  const reset = useResetPassword()

  const [step, setStep] = useState<'request' | 'code' | 'password'>('request')
  const [email, setEmail] = useState('')
  // The code that just passed verify-reset-code — carried into the final
  // reset-password call, which re-validates it itself and is what actually
  // spends it (verifying alone never consumes the code).
  const [verifiedCode, setVerifiedCode] = useState('')
  // Transient "code sent" confirmations go through toast() instead (see
  // goToCodeStep/onResend) — this banner is error-only now.
  const [banner, setBanner] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [done, setDone] = useState(false)

  const requestSchema = useMemo(() => makeRequestSchema(t), [t])
  const codeSchema = useMemo(() => makeCodeSchema(t), [t])
  const passwordSchema = useMemo(() => makePasswordSchema(t), [t])

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
    register: registerCode,
    handleSubmit: handleCode,
    setError: setErrorCode,
    setFocus: setFocusCode,
    formState: { errors: errCode, isValid: validCode },
  } = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    mode: 'onChange',
    defaultValues: { code: '' },
  })

  const {
    register: registerPwd,
    handleSubmit: handlePwd,
    formState: { errors: errPwd, isValid: validPwd },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  // Autofocus the relevant first field for each step.
  useEffect(() => {
    if (step === 'request') setFocusReq('email')
  }, [step, setFocusReq])
  useEffect(() => {
    if (step === 'code') setFocusCode('code')
  }, [step, setFocusCode])

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const goToCodeStep = (submittedEmail: string) => {
    setEmail(submittedEmail)
    setStep('code')
    setLocked(false)
    setCooldown(RESEND_COOLDOWN_SECONDS)
    toast('success', t('forgotPassword.codeSent'))
  }

  const onRequest = (values: RequestForm) => {
    setBanner(null)
    forgot.mutate(
      { email: values.email },
      {
        // The backend always returns the same generic success — move on
        // regardless of response content.
        onSuccess: () => goToCodeStep(values.email),
        onError: () => setBanner(t('forgotPassword.errors.generic')),
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
          toast('success', t('forgotPassword.codeSent'))
        },
        onError: () => setBanner(t('forgotPassword.errors.generic')),
      }
    )
  }

  const onVerifyCode = (values: CodeForm) => {
    setBanner(null)
    verifyCode.mutate(
      { email, code: values.code },
      {
        onSuccess: () => {
          setVerifiedCode(values.code)
          setStep('password')
        },
        onError: (err) => {
          if (err instanceof ApiException) {
            if (err.code === 'AUTH_INVALID_RESET_CODE') {
              setErrorCode('code', {
                message: t('forgotPassword.errors.invalidCode'),
              })
              setFocusCode('code')
              return
            }
            if (err.code === 'AUTH_TOO_MANY_ATTEMPTS') {
              setLocked(true)
              setBanner(t('forgotPassword.errors.tooManyAttempts'))
              return
            }
          }
          setBanner(t('forgotPassword.errors.generic'))
        },
      }
    )
  }

  const onResetPassword = (values: PasswordForm) => {
    setBanner(null)
    reset.mutate(
      { email, code: verifiedCode, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setDone(true)
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        },
        onError: (err) => {
          // The code was accepted by verify-reset-code moments ago but
          // reset-password re-checks it itself — if it expired or was
          // superseded by a resend in between, send the user back to
          // re-enter a fresh one instead of failing silently here.
          if (err instanceof ApiException) {
            if (err.code === 'AUTH_INVALID_RESET_CODE') {
              setStep('code')
              setBanner(t('forgotPassword.errors.invalidCode'))
              return
            }
            if (err.code === 'AUTH_TOO_MANY_ATTEMPTS') {
              setStep('code')
              setLocked(true)
              setBanner(t('forgotPassword.errors.tooManyAttempts'))
              return
            }
          }
          setBanner(t('forgotPassword.errors.generic'))
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

  const subtitle =
    step === 'request'
      ? t('forgotPassword.subtitleRequest')
      : step === 'code'
        ? t('forgotPassword.subtitleReset')
        : t('forgotPassword.subtitleNewPassword')

  return (
    <AuthLayout title={t('forgotPassword.title')} subtitle={subtitle}>
      {step === 'request' && (
        <form onSubmit={handleReq(onRequest)} className="space-y-5" noValidate>
          {banner && <FormBanner variant="error">{banner}</FormBanner>}
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
      )}

      {step === 'code' && (
        <form onSubmit={handleCode(onVerifyCode)} className="space-y-5" noValidate>
          {banner && <FormBanner variant="error">{banner}</FormBanner>}

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

          <div className="flex items-start gap-2 rounded-md border border-border-light bg-surface-secondary p-3 text-sm text-text-secondary">
            <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" />
            <span>{t('forgotPassword.conditionalNotice')}</span>
          </div>

          <TextField
            id="code"
            inputMode="numeric"
            maxLength={6}
            label={t('forgotPassword.code')}
            autoComplete="one-time-code"
            disabled={locked}
            error={errCode.code?.message}
            {...registerCode('code')}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={locked || !validCode || verifyCode.isPending}
          >
            {verifyCode.isPending && <Loader2 className="animate-spin" />}
            {t('forgotPassword.verifyCode')}
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

      {step === 'password' && (
        <form onSubmit={handlePwd(onResetPassword)} className="space-y-5" noValidate>
          {banner && <FormBanner variant="error">{banner}</FormBanner>}

          <PasswordField
            id="newPassword"
            label={t('forgotPassword.newPassword')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            error={errPwd.newPassword?.message}
            {...registerPwd('newPassword')}
          />
          <PasswordField
            id="confirmNewPassword"
            label={t('forgotPassword.confirmPassword')}
            autoComplete="new-password"
            showLabel={t('login.showPassword')}
            hideLabel={t('login.hidePassword')}
            error={errPwd.confirmPassword?.message}
            {...registerPwd('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!validPwd || reset.isPending}
          >
            {reset.isPending && <Loader2 className="animate-spin" />}
            {t('forgotPassword.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
