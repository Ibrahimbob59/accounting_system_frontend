import type { NavigateFunction } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { authApi } from '@/features/auth/api/auth.api'
import { resolveAuthPath } from '@/features/auth/lib/auth-routing'
import type { AuthResponse } from '@/features/auth/types/auth.types'

/**
 * Shared post-auth success path for login and register (and reused by
 * change-password / switch-company). Neither login nor register returns the
 * profile, so: apply the session, fetch /me, then route per §2 — NOT a
 * hardcoded /app, since the user may still owe a password change or a company
 * selection.
 *
 * A failed /auth/me does not undo the (valid) session — the AuthResponse
 * already carries the fields the routing decision needs — so this never rejects.
 */
export async function completeAuth(
  auth: AuthResponse,
  navigate: NavigateFunction
) {
  useAuthStore.getState().setSession(auth)
  try {
    const user = await authApi.getMe()
    useAuthStore.getState().setUser(user)
  } catch {
    // Session is already valid; profile fetch can be retried later.
  }
  navigate(resolveAuthPath(useAuthStore.getState()), { replace: true })
}
