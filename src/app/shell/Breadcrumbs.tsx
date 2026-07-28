import { Fragment } from 'react'
import { Link, useMatches } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

interface CrumbHandle {
  crumbKey: string
}

function hasCrumb(handle: unknown): handle is CrumbHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'crumbKey' in handle &&
    typeof (handle as Record<string, unknown>).crumbKey === 'string'
  )
}

/**
 * Breadcrumbs derived from the matched route chain, not hardcoded per page:
 * any route that sets `handle: { crumbKey }` contributes a crumb. Today only
 * `/app` (Dashboard) does, so it reads just "Dashboard" — but it's already
 * correct for future nested routes (`/app/partners/:id`, ...) with no rework.
 */
export function Breadcrumbs() {
  const { t } = useTranslation('shell')
  const matches = useMatches()

  const crumbs = matches
    .filter((m) => hasCrumb(m.handle))
    .map((m) => ({ key: (m.handle as CrumbHandle).crumbKey, path: m.pathname }))

  if (crumbs.length === 0) return null

  return (
    <nav aria-label={t('breadcrumbs.label')}>
      <ol className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <Fragment key={crumb.path}>
              <li>
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-text-primary"
                  >
                    {t(crumb.key)}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-text-muted hover:text-text-primary"
                  >
                    {t(crumb.key)}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-text-disabled">
                  <ChevronRight className="size-4 rtl:rotate-180" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
