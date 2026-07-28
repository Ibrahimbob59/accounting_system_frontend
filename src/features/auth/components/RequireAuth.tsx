import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'

/**
 * Light gate: requires a session, but deliberately does NOT run the §2
 * company/password checks. Wraps `/change-password` and `/select-company` —
 * the very screens the AuthGuard redirects *to* — so they stay reachable while
 * that block is in effect (gating them with AuthGuard would loop forever).
 */
export function RequireAuth() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
