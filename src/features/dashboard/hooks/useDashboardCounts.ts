import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/features/dashboard/api/dashboard.api'
import type { ApiSuccess } from '@/types/api'

/**
 * A count card's query. `retry: false` so a 403 (a role that can't read that
 * resource) fails fast and the card degrades to "—" rather than retrying;
 * `enabled` skips the call entirely (a platform admin has no active company).
 */
function useCount(
  key: string,
  queryFn: () => Promise<ApiSuccess<unknown[]>>,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['dashboard', key],
    queryFn,
    select: (res) => res.meta?.total ?? 0,
    retry: false,
    enabled,
  })
}

export const useItemsCount = (enabled = true) =>
  useCount('items-count', dashboardApi.itemsCount, enabled)

export const useSalesInvoicesCount = (enabled = true) =>
  useCount('sales-invoices-count', dashboardApi.salesInvoicesCount, enabled)

export const usePurchaseOrdersCount = (enabled = true) =>
  useCount('purchase-orders-count', dashboardApi.purchaseOrdersCount, enabled)

export const useVendorBillsCount = (enabled = true) =>
  useCount('vendor-bills-count', dashboardApi.vendorBillsCount, enabled)

export const usePaymentsCount = (enabled = true) =>
  useCount('payments-count', dashboardApi.paymentsCount, enabled)
