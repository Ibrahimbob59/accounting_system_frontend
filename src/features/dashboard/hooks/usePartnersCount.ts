import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/features/dashboard/api/dashboard.api'

/**
 * Total partners for the active company. `retry: false` so a 403 (a Member role
 * that can't read partners) fails fast and the card degrades quietly rather
 * than retrying. `enabled` lets the caller skip the call entirely (platform
 * admin has no active company to count against).
 */
export function usePartnersCount(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'partners-count'],
    queryFn: dashboardApi.partnersCount,
    select: (res) => res.meta?.total ?? 0,
    retry: false,
    enabled,
  })
}
