import { useQuery } from '@tanstack/react-query'

import { companiesApi } from '@/features/companies/api/companies.api'

/**
 * Settings for one company (base currency, fiscal year, feature flags, …).
 * Cached for a while — settings change rarely, so consumers avoid refetching
 * per mount.
 */
export function useCompanySettings(id: string | undefined) {
  return useQuery({
    queryKey: ['companies', 'settings', id],
    queryFn: () => companiesApi.getSettings(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
