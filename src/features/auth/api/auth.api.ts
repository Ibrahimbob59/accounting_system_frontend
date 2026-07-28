import { http } from '@/lib/api-client'
import type {
  AuthResponse,
  ChangePasswordRequest,
  CurrentUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
  ResetPasswordRequest,
  SwitchCompanyRequest,
  VerifyResetCodeRequest,
} from '@/features/auth/types/auth.types'

/**
 * Thin wrappers over the Phase 0 apiClient — one function per endpoint. The
 * response interceptor already unwraps the `{ data, meta }` envelope, so these
 * return the payload directly and never touch `.data.data`.
 */
export const authApi = {
  login(body: LoginRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/login', body)
  },

  register(body: RegisterRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/register', body)
  },

  getMe(): Promise<CurrentUser> {
    return http.get<CurrentUser>('/auth/me')
  },

  changePassword(body: ChangePasswordRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/change-password', body)
  },

  switchCompany(body: SwitchCompanyRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/switch-company', body)
  },

  forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    return http.post<void>('/auth/forgot-password', body)
  },

  verifyResetCode(body: VerifyResetCodeRequest): Promise<void> {
    return http.post<void>('/auth/verify-reset-code', body)
  },

  resetPassword(body: ResetPasswordRequest): Promise<void> {
    return http.post<void>('/auth/reset-password', body)
  },

  logout(body: LogoutRequest): Promise<void> {
    return http.post<void>('/auth/logout', body)
  },
}
