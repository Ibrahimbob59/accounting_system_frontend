import { useQuery } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['companies', 'detail', id],
    queryFn: () => companiesApi.getCompany(id!),
    enabled: !!id,
  })
}
