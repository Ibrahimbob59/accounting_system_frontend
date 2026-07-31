import { useMutation, useQueryClient } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

export function useDeletePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: partnersApi.deletePartner,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}
