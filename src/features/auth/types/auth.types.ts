export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  company: {
    name: string
    taxNumber?: string
    phone?: string
    email?: string
  }
  user: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }
}

export interface AuthCompany {
  id: string
  name: string
}

/** Token-only subset — the base every auth response builds on. */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  /** Access token lifetime in seconds (backend sends 900 = 15 min). */
  expiresIn: number
}

/**
 * Full AuthResponseDto — returned by login, register, refresh, switch-company
 * and change-password. Richer than tokens alone: it also carries the membership
 * and forced-password-change state the guards route on (§2).
 */
export interface AuthResponse extends AuthTokens {
  /** Every company the user belongs to (empty for a platform admin). */
  companies: AuthCompany[]
  /** null = not yet selected, or platform admin. */
  activeCompanyId: string | null
  mustChangePassword: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface VerifyResetCodeRequest {
  email: string
  code: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface SwitchCompanyRequest {
  companyId: string
}

export interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  companyId: string | null
  preferredLanguage: 'EN' | 'FR' | 'AR'
  avatarUrl?: string | null
  // MeResponseDto extends the profile with the same three session-state fields
  // the AuthResponse carries, so the guards can route straight off /auth/me.
  activeCompanyId: string | null
  companies: AuthCompany[]
  mustChangePassword: boolean
}

export interface LogoutRequest {
  refreshToken: string
}
