import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateStockTransferInput,
  ListStockTransfersQuery,
  StockTransfer,
} from '@/features/stock/types/stock-ops.types'

/** Inter-branch stock transfers (backend FR-404). DRAFT → [APPROVED] → POSTED;
 *  posting moves each line value-neutrally to the destination location. */
export const stockTransfersApi = {
  list(query?: ListStockTransfersQuery): Promise<ApiSuccess<StockTransfer[]>> {
    return http.getPage<StockTransfer[]>('/stock-transfers', { params: query })
  },

  get(id: string): Promise<StockTransfer> {
    return http.get<StockTransfer>(`/stock-transfers/${id}`)
  },

  create(dto: CreateStockTransferInput): Promise<StockTransfer> {
    return http.post<StockTransfer>('/stock-transfers', dto)
  },

  approve(id: string): Promise<StockTransfer> {
    return http.post<StockTransfer>(`/stock-transfers/${id}/approve`)
  },

  post(id: string): Promise<StockTransfer> {
    return http.post<StockTransfer>(`/stock-transfers/${id}/post`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/stock-transfers/${id}`)
  },
}
