import { useMutation, useQueryClient } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'
import type { UpdateAccountDto } from '@/features/accounts/types/accounts.types'

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAccountDto }) =>
      accountsApi.updateAccount(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
