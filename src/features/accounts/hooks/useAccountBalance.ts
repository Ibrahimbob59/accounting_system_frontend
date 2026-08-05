import { useQuery } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

/** `asOf` is part of the key so changing the date refetches rather than
 * showing a stale balance under a new date (same pattern as usePartnerBalance). */
export function useAccountBalance(
  id: string | undefined,
  asOf?: string,
  presentIn?: string
) {
  return useQuery({
    queryKey: ['accounts', 'balance', id, asOf ?? '', presentIn ?? ''],
    queryFn: () => accountsApi.getBalance(id!, asOf || undefined, presentIn),
    enabled: !!id,
  })
}
