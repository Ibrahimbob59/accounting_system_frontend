import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'
import type { ListPartnersQuery } from '@/features/partners/types/partners.types'

export function usePartners(query: ListPartnersQuery) {
  return useQuery({
    queryKey: ['partners', query],
    queryFn: () => partnersApi.listPartners(query),
    placeholderData: (prev) => prev,
  })
}
