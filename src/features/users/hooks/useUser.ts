import { useQuery } from '@tanstack/react-query'

import { usersApi } from '@/features/users/api/users.api'

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => usersApi.getUser(id!),
    enabled: !!id,
  })
}
