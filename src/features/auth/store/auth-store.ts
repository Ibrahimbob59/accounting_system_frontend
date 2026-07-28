import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AuthCompany,
  AuthResponse,
  CurrentUser,
} from '@/features/auth/types/auth.types'

interface AuthState {
  user: CurrentUser | null
  /** In-memory only — never persisted. Short-lived (≈15 min). */
  accessToken: string | null
  /** Persisted to localStorage so a page refresh doesn't force re-login. */
  refreshToken: string | null
  isAuthenticated: boolean
  /** Every company the user belongs to (empty for a platform admin). */
  companies: AuthCompany[]
  /** null = not yet selected, or platform admin. */
  activeCompanyId: string | null
  /** Backend forces a password change before anything else is reachable. */
  mustChangePassword: boolean
  /**
   * True while a silent /auth/refresh is in flight on app boot. The AuthGuard
   * shows a loading state instead of flashing the login page during this window.
   */
  isBootstrapping: boolean
  /**
   * Apply a fresh AuthResponse. This is the single entry point for every
   * token-issuing action (login, register, refresh, switch-company,
   * change-password) — tokens and the three session-state fields always move
   * together, so there's no call site that can update one and forget another.
   */
  setSession: (auth: AuthResponse) => void
  /**
   * Populate the profile from /auth/me. MeResponse carries the same session
   * fields, so this keeps them in sync with the latest server truth too.
   */
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
      companies: [],
      activeCompanyId: null,
      mustChangePassword: false,
      isBootstrapping: true,
      setSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          companies: auth.companies,
          activeCompanyId: auth.activeCompanyId,
          mustChangePassword: auth.mustChangePassword,
          isAuthenticated: true,
        }),
      setUser: (user) =>
        set({
          user,
          companies: user.companies,
          activeCompanyId: user.activeCompanyId,
          mustChangePassword: user.mustChangePassword,
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          companies: [],
          activeCompanyId: null,
          mustChangePassword: false,
        }),
      setBootstrapping: (value) => set({ isBootstrapping: value }),
    }),
    {
      name: 'auth',
      // Persist ONLY the refresh token. Everything else stays in memory and is
      // repopulated on boot via the silent refresh + /auth/me.
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    }
  )
)
