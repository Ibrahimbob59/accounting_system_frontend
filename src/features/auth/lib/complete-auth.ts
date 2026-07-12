import type { NavigateFunction } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { authApi } from '@/features/auth/api/auth.api'
import type { AuthTokens } from '@/features/auth/types/auth.types'

/**
 * Shared post-auth success path for both login and register — neither response
 * includes user data, only tokens, so both flows: store tokens, fetch the
 * profile, land on the app.
 *
 * A failed /auth/me here does not undo the (valid) session — the profile can be
 * refetched by the app shell in Phase 2 — so this never rejects.
 */
export async function completeAuth(
  tokens: AuthTokens,
  navigate: NavigateFunction
) {
  useAuthStore.getState().setTokens(tokens)
  try {
    const user = await authApi.getMe()
    useAuthStore.getState().setUser(user)
  } catch {
    // Session is already valid; profile fetch can be retried later.
  }
  navigate('/app', { replace: true })
}
