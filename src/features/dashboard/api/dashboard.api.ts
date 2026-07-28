import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'

/**
 * Dashboard count calls. `limit=1` because only `meta.total` is needed, not the
 * rows — `getPage` keeps the envelope so the hook can read that total. No
 * business logic here (per CONVENTIONS.md); the hooks pull `meta.total` out.
 */
export const dashboardApi = {
  partnersCount(): Promise<ApiSuccess<unknown[]>> {
    return http.getPage<unknown[]>('/partners', { params: { limit: 1 } })
  },
  usersCount(): Promise<ApiSuccess<unknown[]>> {
    return http.getPage<unknown[]>('/users', { params: { limit: 1 } })
  },
  accountsCount(): Promise<ApiSuccess<unknown[]>> {
    return http.getPage<unknown[]>('/accounts', { params: { limit: 1 } })
  },
}
