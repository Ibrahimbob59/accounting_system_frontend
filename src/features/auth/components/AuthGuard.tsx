import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { resolveAuthPath } from '@/features/auth/lib/auth-routing'

/**
 * Gate for the `/app` product area. Runs the full §2 routing decision on every
 * entry (and after the boot-time silent refresh): an authenticated user who
 * still owes a password change or a company selection is redirected there
 * instead of into the app; everyone else passes through.
 *
 * While a boot-time token refresh is in flight, show a minimal loading state
 * rather than flashing a redirect.
 */
export function AuthGuard() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword)
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const companies = useAuthStore((s) => s.companies)

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Loading...
      </div>
    )
  }

  const target = resolveAuthPath({
    isAuthenticated,
    mustChangePassword,
    activeCompanyId,
    companies,
  })
  if (target !== '/app') {
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
