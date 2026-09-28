import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateGoodsReceiptInput,
  GoodsReceipt,
  ListGoodsReceiptsQuery,
} from '@/features/purchasing/types/purchasing.types'

/** Goods receipts (backend FR-501). Creating a receipt posts the stock-in
 *  movements against a purchase order at the received quantities. */
export const goodsReceiptsApi = {
  list(query?: ListGoodsReceiptsQuery): Promise<ApiSuccess<GoodsReceipt[]>> {
    return http.getPage<GoodsReceipt[]>('/goods-receipts', { params: query })
  },

  get(id: string): Promise<GoodsReceipt> {
    return http.get<GoodsReceipt>(`/goods-receipts/${id}`)
  },

  create(dto: CreateGoodsReceiptInput): Promise<GoodsReceipt> {
    return http.post<GoodsReceipt>('/goods-receipts', dto)
  },
}
