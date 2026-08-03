import { useMutation, useQueryClient } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: companiesApi.deleteCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
