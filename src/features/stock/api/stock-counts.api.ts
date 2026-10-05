import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateStockCountInput,
  ListStockCountsQuery,
  StockCount,
} from '@/features/stock/types/stock-ops.types'

/** Stock counts (backend FR-403). A DRAFT snapshots on-hand; posting reconciles
 *  the variance (adjustment movements + one variance journal). */
export const stockCountsApi = {
  list(query?: ListStockCountsQuery): Promise<ApiSuccess<StockCount[]>> {
    return http.getPage<StockCount[]>('/stock-counts', { params: query })
  },

  get(id: string): Promise<StockCount> {
    return http.get<StockCount>(`/stock-counts/${id}`)
  },

  create(dto: CreateStockCountInput): Promise<StockCount> {
    return http.post<StockCount>('/stock-counts', dto)
  },

  post(id: string): Promise<StockCount> {
    return http.post<StockCount>(`/stock-counts/${id}/post`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/stock-counts/${id}`)
  },
}
