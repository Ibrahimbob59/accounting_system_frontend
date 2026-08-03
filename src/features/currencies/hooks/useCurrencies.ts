import { useQuery } from '@tanstack/react-query'

import { currenciesApi } from '@/features/currencies/api/currencies.api'

/** The currency registry. Effectively static, so it's cached aggressively —
 * it's read on nearly every money-rendering screen. */
export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: currenciesApi.listCurrencies,
    staleTime: 60 * 60 * 1000,
  })
}
