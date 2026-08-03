import { useQuery } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'

/**
 * Settings for one company. Cached for a while because `useBaseCurrency` reads
 * it on every money-rendering screen — settings change rarely, and refetching
 * per mount would put a request behind every balance shown.
 */
export function useCompanySettings(id: string | undefined) {
  return useQuery({
    queryKey: ['companies', 'settings', id],
    queryFn: () => companiesApi.getSettings(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
