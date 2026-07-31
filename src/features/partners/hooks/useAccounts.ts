import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

/** Feeds the §3.5 read-only AR/AP account-override combobox. */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: partnersApi.listAccounts,
    staleTime: 5 * 60 * 1000,
  })
}
