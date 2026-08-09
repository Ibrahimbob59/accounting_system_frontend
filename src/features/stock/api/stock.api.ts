import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  AdjustStockInput,
  BulkOnHandQuery,
  ItemStock,
  ListMovementsQuery,
  OnHandRow,
  StockMovement,
  TransferStockInput,
  ValuationResult,
} from '@/features/stock/types/stock.types'

/** Stock reads + manual operations. */
export const stockApi = {
  bulkOnHand(query?: BulkOnHandQuery): Promise<ApiSuccess<OnHandRow[]>> {
    return http.getPage<OnHandRow[]>('/stock/on-hand/bulk', { params: query })
  },

  itemStock(itemId: string): Promise<ItemStock> {
    return http.get<ItemStock>(`/items/${itemId}/stock`)
  },

  listMovements(
    query?: ListMovementsQuery
  ): Promise<ApiSuccess<StockMovement[]>> {
    return http.getPage<StockMovement[]>('/stock/movements', { params: query })
  },

  valuation(asOf?: string): Promise<ValuationResult> {
    return http.get<ValuationResult>('/stock/valuation', {
      params: asOf ? { asOf } : undefined,
    })
  },

  adjust(input: AdjustStockInput): Promise<StockMovement> {
    return http.post<StockMovement>('/stock/adjustments', input)
  },

  transfer(input: TransferStockInput): Promise<StockMovement> {
    return http.post<StockMovement>('/stock/transfers', input)
  },
}
