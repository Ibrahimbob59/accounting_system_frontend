import { useQuery } from '@tanstack/react-query'

import { usersApi } from '@/features/users/api/users.api'

/** Roles change rarely and are read by both the invite dialog and the
 * invitations table, so a long staleTime avoids refetching per mount. */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: usersApi.listRoles,
    staleTime: 5 * 60 * 1000,
  })
}
