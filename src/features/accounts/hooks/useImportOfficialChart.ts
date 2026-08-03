import { useMutation, useQueryClient } from '@tanstack/react-query'

import { accountsApi } from '@/features/accounts/api/accounts.api'

/** Bulk import — invalidates the whole `accounts` key since it can add
 * hundreds of rows across both the tree and the list. */
export function useImportOfficialChart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.importOfficialChart,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
