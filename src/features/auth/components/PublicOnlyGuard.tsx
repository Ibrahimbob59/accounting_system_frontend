import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { resolveAuthPath } from '@/features/auth/lib/auth-routing'

/**
 * Reverse of AuthGuard: keeps already-authenticated users out of the public
 * screens (landing, login, register, forgot-password). It routes them through
 * the same §2 resolver as everything else, so a user who still owes a password
 * change or company selection lands there directly instead of bouncing through
 * /app first. Waits for boot-time refresh to settle so a returning user isn't
 * briefly shown a public page.
 */
export function PublicOnlyGuard() {
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

  if (isAuthenticated) {
    return (
      <Navigate
        to={resolveAuthPath({
          isAuthenticated,
          mustChangePassword,
          activeCompanyId,
          companies,
        })}
        replace
      />
    )
  }

  return <Outlet />
}
