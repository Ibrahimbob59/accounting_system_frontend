import { useMutation, useQueryClient } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'
import type { UpdateCompanyDto } from '@/features/companies/types/companies.types'

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCompanyDto }) =>
      companiesApi.updateCompany(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
