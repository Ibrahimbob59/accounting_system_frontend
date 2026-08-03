import { useQuery } from '@tanstack/react-query'

import { usersApi } from '@/features/users/api/users.api'
import type { ListUsersQuery } from '@/features/users/types/users.types'

/** `placeholderData` keeps the previous page on screen while the next one
 * loads, so paging doesn't flash an empty table (same as usePartners). */
export function useUsers(query: ListUsersQuery) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => usersApi.listUsers(query),
    placeholderData: (prev) => prev,
  })
}
