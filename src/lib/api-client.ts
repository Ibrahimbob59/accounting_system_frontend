import axios from 'axios'
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { ApiException } from '@/types/api'
import type { ApiErrorBody } from '@/types/api'
import type { AuthResponse } from '@/features/auth/types/auth.types'

const baseURL = import.meta.env.VITE_API_BASE_URL as string

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Requests we've already retried once carry this flag so we don't loop forever.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/** Shape the backend returns from /auth/refresh — a full AuthResponse. */
interface RefreshResponse {
  data: AuthResponse
}

// ---------------------------------------------------------------------------
// Request interceptor — attach the in-memory access token.
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Silent refresh — deduped so concurrent 401s trigger only one refresh call.
// Uses a bare axios call to avoid recursing through this instance's
// interceptors.
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) throw new Error('No refresh token')

    const { data } = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken }
    )
    useAuthStore.getState().setSession(data.data)
    return data.data.accessToken
  })()

  refreshPromise.finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function redirectToLogin() {
  useAuthStore.getState().clearSession()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ---------------------------------------------------------------------------
// Response interceptor.
//  1. success  -> unwrap the envelope, hand the caller `data` directly
//  2. 401      -> one silent refresh + retry, else clear session -> /login
//  3. ApiError -> throw a typed ApiException carrying code/message/field
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap `{ data, meta }` so callers never touch the envelope.
    return response.data?.data ?? response.data
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    if (status === 401 && isRefreshCall) {
      redirectToLogin()
    }

    const body = error.response?.data
    if (body && typeof body === 'object' && 'error' in body && body.error) {
      throw new ApiException(
        body.error.code,
        body.error.message,
        body.error.field
      )
    }

    return Promise.reject(error)
  }
)

/**
 * Typed request helpers. The response interceptor above unwraps the envelope
 * at runtime, so the resolved value is the payload `T` even though axios's own
 * types still describe an AxiosResponse — this is the single place that reconciles
 * that difference, so callers get clean `Promise<T>` signatures.
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post(url, body, config) as unknown as Promise<T>,
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put(url, body, config) as unknown as Promise<T>,
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch(url, body, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete(url, config) as unknown as Promise<T>,
}
