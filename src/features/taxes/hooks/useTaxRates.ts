import { useQuery } from '@tanstack/react-query'

import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type { TaxRate } from '@/features/taxes/types/taxes.types'

/**
 * The company's VAT rates. `GET /tax-rates` is paginated; a company has only a
 * handful, so one generous page fetches them all for pickers and name lookup.
 */
export function useTaxRates() {
  return useQuery({
    queryKey: ['tax-rates'],
    queryFn: () =>
      http.getPage<TaxRate[]>('/tax-rates', { params: { limit: 100 } }),
    staleTime: 5 * 60 * 1000,
    select: (res: ApiSuccess<TaxRate[]>) => res.data,
  })
}
