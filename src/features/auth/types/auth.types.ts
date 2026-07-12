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

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  /** Access token lifetime in seconds (backend sends 900 = 15 min). */
  expiresIn: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  companyId: string | null
  preferredLanguage: 'EN' | 'FR' | 'AR'
  // extend as /auth/me's real response shape is confirmed in Phase 2
}
