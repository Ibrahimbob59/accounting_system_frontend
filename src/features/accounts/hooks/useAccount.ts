import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['accounts', 'detail', id],
    queryFn: () => accountsApi.getAccount(id!),
    enabled: !!id,
  })
}
