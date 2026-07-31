import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'
import type { PartnerTransactionsQuery } from '@/features/partners/types/partners.types'

export function usePartnerTransactions(
  id: string | undefined,
  query: PartnerTransactionsQuery
) {
  return useQuery({
    queryKey: ['partners', id, 'transactions', query],
    queryFn: () => partnersApi.getPartnerTransactions(id!, query),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })
}
