import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'
import type { ListAccountsQuery } from '@/features/accounts/types/accounts.types'

/**
 * The flat, filterable list. Called with no query by the partner form's
 * account picker (which just needs every account), and with filters by the
 * accounts list screen.
 */
export function useAccounts(query?: ListAccountsQuery) {
  return useQuery({
    queryKey: ['accounts', query ?? {}],
    queryFn: () => accountsApi.listAccounts(query),
    placeholderData: (prev) => prev,
  })
}
