import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from '@/features/dashboard/api/dashboard.api'

/** Team members (users) in the active company. See usePartnersCount for the
 * retry/enabled rationale. */
export function useUsersCount(enabled = true) {
  return useQuery({
    queryKey: ['dashboard', 'users-count'],
    queryFn: dashboardApi.usersCount,
    select: (res) => res.meta?.total ?? 0,
    retry: false,
    enabled,
  })
}
