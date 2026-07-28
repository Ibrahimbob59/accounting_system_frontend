import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth-store'

/**
 * Log out: best-effort server-side session revocation, then always clear the
 * client session and land on /login. The local clear must happen even if the
 * network call fails — otherwise a user who lost connectivity could stay
 * "logged in" locally. `replace: true` so a back-navigation can't return to a
 * protected screen (its guard re-runs against the now-empty session anyway).
 */
export function useLogout() {
  const navigate = useNavigate()
  const [isPending, setIsPending] = useState(false)

  const logout = useCallback(async () => {
    setIsPending(true)
    const { refreshToken, clearSession } = useAuthStore.getState()
    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken })
      }
    } catch {
      // Ignore — we clear the local session regardless.
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return { logout, isPending }
}
