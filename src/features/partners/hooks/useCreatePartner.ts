import { useMutation, useQueryClient } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

export function useCreatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: partnersApi.createPartner,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}
