import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store/auth-store'

/**
 * Rendered for a genuinely unmatched path (the `path: '*'` catch-all in
 * router/index.tsx) and, via RouteErrorBoundary, for a 404 RouteErrorResponse
 * bubbling up from within a matched route — same UI either way. Deliberately
 * has no dependency on route-error hooks so it works standalone in both
 * contexts.
 */
export function NotFoundPage() {
  const { t } = useTranslation('common')
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
      <p className="font-display text-7xl font-bold text-text-primary">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text-primary">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-sm text-text-secondary">
        {t('notFound.body')}
      </p>
      <Button asChild className="mt-6">
        <Link to={isAuthenticated ? '/app' : '/'}>{t('notFound.backHome')}</Link>
      </Button>
    </div>
  )
}
