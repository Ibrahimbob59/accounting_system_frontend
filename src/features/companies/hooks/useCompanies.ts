import { useQuery } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'
import type { ListCompaniesQuery } from '@/features/companies/types/companies.types'

export function useCompanies(query?: ListCompaniesQuery) {
  return useQuery({
    queryKey: ['companies', query ?? {}],
    queryFn: () => companiesApi.listCompanies(query),
    placeholderData: (prev) => prev,
  })
}
