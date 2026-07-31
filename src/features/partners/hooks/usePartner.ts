import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

export function usePartner(id: string | undefined) {
  return useQuery({
    queryKey: ['partners', id],
    queryFn: () => partnersApi.getPartner(id!),
    enabled: !!id,
  })
}
