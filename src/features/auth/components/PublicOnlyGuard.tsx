import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'

/**
 * Reverse of AuthGuard: keeps already-authenticated users out of the public
 * screens (landing, login, register, forgot-password) by sending them to
 * `/app`. Waits for boot-time refresh to settle so a returning user isn't
 * briefly shown a public page.
 */
export function PublicOnlyGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Loading...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
