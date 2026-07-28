import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { authApi } from '@/features/auth/api/auth.api'
import { refreshAccessToken } from '@/lib/api-client'

/**
 * On app boot, if a persisted refresh token exists, silently exchange it for a
 * fresh session before the protected area renders, then load the profile.
 * Flips `isBootstrapping` off once settled so the guards can decide.
 *
 * Only a failed *refresh* clears the session. A failed /auth/me does NOT —
 * refresh's AuthResponse already populated the routing state (companies,
 * activeCompanyId, mustChangePassword) via setSession, so the guards can route
 * correctly even without the profile (and /me can legitimately 403 while a
 * password change is pending).
 */
export function useAuthBootstrap() {
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)

  useEffect(() => {
    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) {
      setBootstrapping(false)
      return
    }

    void (async () => {
      try {
        await refreshAccessToken()
      } catch {
        useAuthStore.getState().clearSession()
        setBootstrapping(false)
        return
      }

      try {
        const user = await authApi.getMe()
        useAuthStore.getState().setUser(user)
      } catch {
        // Session is valid from the refresh; profile can be refetched later.
      }
      setBootstrapping(false)
    })()
  }, [setBootstrapping])
}
