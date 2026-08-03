import { useMutation, useQueryClient } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.deleteAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
