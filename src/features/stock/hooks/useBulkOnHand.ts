import { useQuery } from '@tanstack/react-query'

import { stockApi } from '@/features/stock/api/stock.api'
import type { BulkOnHandQuery } from '@/features/stock/types/stock.types'

/** The paginated bulk on-hand report. */
export function useBulkOnHand(query?: BulkOnHandQuery) {
  return useQuery({
    queryKey: ['stock', 'on-hand', query ?? {}],
    queryFn: () => stockApi.bulkOnHand(query),
    placeholderData: (prev) => prev,
  })
}
