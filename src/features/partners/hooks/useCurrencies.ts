import { useQuery } from '@tanstack/react-query'

import { partnersApi } from '@/features/partners/api/partners.api'

/** Feeds the §3.4 credit-currency select — real `GET /currencies`, not hardcoded. */
export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: partnersApi.listCurrencies,
    staleTime: 5 * 60 * 1000,
  })
}
