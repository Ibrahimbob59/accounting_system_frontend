import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  BulkOnHandQuery,
  OnHandRow,
} from '@/features/stock/types/stock.types'

/** Stock reads. `bulkOnHand` is paginated; movements/valuation land in Phase 2. */
export const stockApi = {
  bulkOnHand(query?: BulkOnHandQuery): Promise<ApiSuccess<OnHandRow[]>> {
    return http.getPage<OnHandRow[]>('/stock/on-hand/bulk', { params: query })
  },
}
