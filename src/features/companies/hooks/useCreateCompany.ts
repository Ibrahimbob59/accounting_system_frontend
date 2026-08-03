import { useMutation, useQueryClient } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: companiesApi.createCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
