import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'

/**
 * Gate for the protected route group. Pure plumbing for Phase 0 — there is no
 * real login yet.
 *  - While a boot-time token refresh is in flight, show a minimal loading state
 *    rather than flashing the login page.
 *  - Once settled, redirect unauthenticated users to /login.
 */
export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)

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
