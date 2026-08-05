import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

export function usePartnerBalance(
  id: string | undefined,
  asOf?: string,
  presentIn?: string
) {
  return useQuery({
    queryKey: ['partners', id, 'balance', asOf ?? null, presentIn ?? null],
    queryFn: () => partnersApi.getPartnerBalance(id!, asOf, presentIn),
    enabled: !!id,
  })
}
