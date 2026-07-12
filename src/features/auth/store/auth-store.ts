import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthTokens, CurrentUser } from '@/features/auth/types/auth.types'

interface AuthState {
  user: CurrentUser | null
  /** In-memory only — never persisted. Short-lived (≈15 min). */
  accessToken: string | null
  /** Persisted to localStorage so a page refresh doesn't force re-login. */
  refreshToken: string | null
  isAuthenticated: boolean
  /**
   * True while a silent /auth/refresh is in flight on app boot. The AuthGuard
   * shows a loading state instead of flashing the login page during this window.
   */
  isBootstrapping: boolean
  /**
   * Store tokens. This alone marks the session authenticated — login/register
   * responses carry only tokens, and the profile is fetched separately via
   * setUser (see features/auth/lib/complete-auth.ts).
   */
  setTokens: (tokens: AuthTokens) => void
  setUser: (user: CurrentUser) => void
  clearSession: () => void
  setBootstrapping: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBootstrapping: true,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),
      setUser: (user) => set({ user }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setBootstrapping: (value) => set({ isBootstrapping: value }),
    }),
    {
      name: 'auth',
      // Persist ONLY the refresh token. accessToken/user stay in memory.
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    }
  )
)
