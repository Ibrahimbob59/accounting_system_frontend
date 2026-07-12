import { useEffect } from 'react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { authApi } from '@/features/auth/api/auth.api'
import { refreshAccessToken } from '@/lib/api-client'

/**
 * On app boot, if a persisted refresh token exists, silently exchange it for a
 * fresh access token and load the profile before the protected area renders.
 * Flips `isBootstrapping` off once settled so the AuthGuard can decide.
 */
export function useAuthBootstrap() {
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)

  useEffect(() => {
    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) {
      setBootstrapping(false)
      return
    }

    refreshAccessToken()
      .then(async () => {
        const user = await authApi.getMe()
        useAuthStore.getState().setUser(user)
      })
      .catch(() => useAuthStore.getState().clearSession())
      .finally(() => setBootstrapping(false))
  }, [setBootstrapping])
}
