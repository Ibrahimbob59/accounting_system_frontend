import { http } from '@/lib/api-client'
import type {
  AuthTokens,
  CurrentUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@/features/auth/types/auth.types'

/**
 * Thin wrappers over the Phase 0 apiClient — one function per endpoint. The
 * response interceptor already unwraps the `{ data, meta }` envelope, so these
 * return the payload directly and never touch `.data.data`.
 */
export const authApi = {
  login(body: LoginRequest): Promise<AuthTokens> {
    return http.post<AuthTokens>('/auth/login', body)
  },

  register(body: RegisterRequest): Promise<AuthTokens> {
    return http.post<AuthTokens>('/auth/register', body)
  },

  getMe(): Promise<CurrentUser> {
    return http.get<CurrentUser>('/auth/me')
  },

  forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    return http.post<void>('/auth/forgot-password', body)
  },

  resetPassword(body: ResetPasswordRequest): Promise<void> {
    return http.post<void>('/auth/reset-password', body)
  },

  logout(): Promise<void> {
    return http.post<void>('/auth/logout')
  },
}
