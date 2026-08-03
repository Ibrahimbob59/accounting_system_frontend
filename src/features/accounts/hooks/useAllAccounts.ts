import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'
import { flattenAccountTree } from '@/features/accounts/types/accounts.types'

/**
 * Every account, flat — for pickers and id→name lookups.
 *
 * Sourced from `/accounts/tree`, not `/accounts`, and that matters: the list
 * endpoint is paginated with a backend-enforced `limit` ceiling of 100, so
 * against the 759-account official chart it can never return the full set.
 * (The partner form's account combobox previously called the list endpoint
 * with no params and silently offered only the first 20 accounts.) The tree
 * endpoint ignores pagination and returns everything in one request.
 */
export function useAllAccounts() {
  return useQuery({
    queryKey: ['accounts', 'all'],
    queryFn: accountsApi.getTree,
    select: flattenAccountTree,
    staleTime: 5 * 60 * 1000,
  })
}
