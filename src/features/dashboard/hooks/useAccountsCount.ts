import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/features/dashboard/api/dashboard.api'

/** Chart-of-accounts size for the active company. See usePartnersCount for the
 * retry/enabled rationale. */
export function useAccountsCount(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'accounts-count'],
    queryFn: dashboardApi.accountsCount,
    select: (res) => res.meta?.total ?? 0,
    retry: false,
    enabled,
  })
}
