import { useMutation, useQueryClient } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'
import type { UpdatePartnerDto } from '@/features/partners/types/partners.types'

export function useUpdatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePartnerDto }) =>
      partnersApi.updatePartner(id, dto),
    onSuccess: (partner) => {
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.setQueryData(['partners', partner.id], partner)
    },
  })
}
