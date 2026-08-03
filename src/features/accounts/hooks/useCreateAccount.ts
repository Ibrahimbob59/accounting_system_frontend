import { useMutation, useQueryClient } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.createAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
