import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

/** The whole chart, nested. One request — the tree arrives assembled. */
export function useAccountTree() {
  return useQuery({
    queryKey: ['accounts', 'tree'],
    queryFn: accountsApi.getTree,
  })
}
