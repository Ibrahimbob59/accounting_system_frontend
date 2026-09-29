import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'

/**
 * Dashboard count calls. `limit=1` because only `meta.total` is needed, not the
 * rows — `getPage` keeps the envelope so the hook can read that total. No
 * business logic here (per CONVENTIONS.md); the hooks pull `meta.total` out.
 */
const count = (path: string, params: Record<string, unknown> = {}) =>
  http.getPage<unknown[]>(path, { params: { limit: 1, ...params } })

export const dashboardApi = {
  partnersCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/partners')
  },
  usersCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/users')
  },
  accountsCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/accounts')
  },
  itemsCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/items')
  },
  salesInvoicesCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/sales-invoices')
  },
  purchaseOrdersCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/purchase-orders')
  },
  vendorBillsCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/vendor-bills')
  },
  paymentsCount(): Promise<ApiSuccess<unknown[]>> {
    return count('/payments')
  },
}
