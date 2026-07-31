import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

export function usePartnerBalance(id: string | undefined, asOf?: string) {
  return useQuery({
    queryKey: ['partners', id, 'balance', asOf ?? null],
    queryFn: () => partnersApi.getPartnerBalance(id!, asOf),
    enabled: !!id,
  })
}
