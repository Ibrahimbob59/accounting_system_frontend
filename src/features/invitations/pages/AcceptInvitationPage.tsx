import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAcceptInvitation } from '@/features/invitations/hooks/useAcceptInvitation'
import { ApiException } from '@/types/api'

/**
 * One-shot invitation acceptance (auth-gap §5). Public and ungated — an
 * already-logged-in user might legitimately open an invitation link too (e.g.
 * joining a second company), so it never redirects on auth state.
 *
 * There's no form: arriving on the page with a valid token IS the action, so it
 * auto-submits once on mount. Success never logs the person in — the response
 * carries no tokens by design — it just points them to /login.
 */
export function AcceptInvitationPage() {
  const { t } = useTranslation('invitations')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const accept = useAcceptInvitation()
  const { mutate } = accept
  // Guard against React StrictMode's double-invoked effect firing two POSTs.
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || !token) return
    firedRef.current = true
    mutate({ token })
  }, [token, mutate])

  let body: ReactNode

  if (!token) {
    // Missing token → error immediately, without calling the API.
    body = (
      <StatusCard variant="error" message={t('errors.invalid')}>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">{t('goToLogin')}</Link>
        </Button>
      </StatusCard>
    )
  } else if (accept.isSuccess) {
    body = (
      <StatusCard
        variant="success"
        message={
          accept.data.isNewUser ? t('success.newUser') : t('success.existing')
        }
      >
        <Button asChild className="w-full">
          <Link to="/login">{t('goToLogin')}</Link>
        </Button>
      </StatusCard>
    )
  } else if (accept.isError) {
    body = (
      <StatusCard variant="error" message={errorMessage(accept.error, t)}>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">{t('goToLogin')}</Link>
        </Button>
      </StatusCard>
    )
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 py-6 text-text-secondary">
        <Loader2 className="size-8 animate-spin text-primary-700" />
        <p>{t('loading')}</p>
      </div>
    )
  }

  return <AuthLayout title={t('title')}>{body}</AuthLayout>
}

function StatusCard({
  variant,
  message,
  children,
}: {
  variant: 'success' | 'error'
  message: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        {variant === 'success' ? (
          <CheckCircle2 className="size-12 text-success" />
        ) : (
          <XCircle className="size-12 text-danger" />
        )}
        <p className="text-text-secondary">{message}</p>
      </div>
      {children}
    </div>
  )
}

function errorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'INVITATION_INVALID':
        return t('errors.invalid')
      case 'INVITATION_EXPIRED':
        return t('errors.expired')
      case 'INVITATION_ALREADY_ACCEPTED':
        return t('errors.alreadyAccepted')
    }
  }
  return t('errors.generic')
}
