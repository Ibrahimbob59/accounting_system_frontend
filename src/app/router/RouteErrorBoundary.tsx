import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { NotFoundPage } from './NotFoundPage'

/**
 * Router-level errorElement — catches a genuine thrown/render error within a
 * matched route, replacing React Router's default developer-facing error
 * screen with something a real user can act on. The `path: '*'` catch-all
 * (index.tsx) handles the far more common "no route matched at all" case
 * directly; this boundary is for actual exceptions, though it also defers to
 * NotFoundPage if a 404 RouteErrorResponse ends up here instead.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useTranslation('common')

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        {t('error.title')}
      </h1>
      <p className="ledger-rule mt-3 max-w-sm text-text-secondary">
        {t('error.body')}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('error.reload')}
        </Button>
        <Button asChild>
          <Link to="/">{t('error.backHome')}</Link>
        </Button>
      </div>
    </div>
  )
}
