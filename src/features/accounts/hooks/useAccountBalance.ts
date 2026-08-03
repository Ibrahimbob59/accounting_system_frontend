import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

/** `asOf` is part of the key so changing the date refetches rather than
 * showing a stale balance under a new date (same pattern as usePartnerBalance). */
export function useAccountBalance(id: string | undefined, asOf?: string) {
  return useQuery({
    queryKey: ['accounts', 'balance', id, asOf ?? ''],
    queryFn: () => accountsApi.getBalance(id!, asOf || undefined),
    enabled: !!id,
  })
}
