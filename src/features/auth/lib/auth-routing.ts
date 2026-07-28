import type { AuthCompany } from '@/features/auth/types/auth.types'

export interface AuthRoutingState {
  isAuthenticated: boolean
  mustChangePassword: boolean
  activeCompanyId: string | null
  companies: AuthCompany[]
}

/**
 * The four-state routing decision (auth-gap §2), checked in this exact order.
 * Returns the path the user belongs at right now. This is the single source of
 * truth — both the AuthGuard and every post-auth-action navigation
 * (login/register/change-password/switch-company) route through it, so the
 * decision can't drift between "on entry" and "after an action".
 *
 * 1. Not authenticated                          → /login
 * 2. mustChangePassword                         → /change-password (blocks all)
 * 3. no active company + belongs to more than 1 → /select-company
 * 4. everything else                            → /app
 *
 * A platform admin (companies empty, activeCompanyId null) and a single-company
 * user (activeCompanyId already set by the backend) both fall through to /app —
 * the state-3 condition excludes them without needing an explicit admin flag.
 */
export function resolveAuthPath(s: AuthRoutingState): string {
  if (!s.isAuthenticated) return '/login'
  if (s.mustChangePassword) return '/change-password'
  if (s.activeCompanyId === null && s.companies.length > 1) {
    return '/select-company'
  }
  return '/app'
}
