import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  PurchaseOrder,
} from '@/features/purchasing/types/purchasing.types'

/** Purchase orders (backend FR-501). A DRAFT is created/edited, then confirmed;
 *  goods are received against it and it is billed. */
export const purchaseOrdersApi = {
  list(query?: ListPurchaseOrdersQuery): Promise<ApiSuccess<PurchaseOrder[]>> {
    return http.getPage<PurchaseOrder[]>('/purchase-orders', { params: query })
  },

  get(id: string): Promise<PurchaseOrder> {
    return http.get<PurchaseOrder>(`/purchase-orders/${id}`)
  },

  create(dto: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    return http.post<PurchaseOrder>('/purchase-orders', dto)
  },

  update(
    id: string,
    dto: Partial<CreatePurchaseOrderInput>
  ): Promise<PurchaseOrder> {
    return http.patch<PurchaseOrder>(`/purchase-orders/${id}`, dto)
  },

  confirm(id: string): Promise<PurchaseOrder> {
    return http.post<PurchaseOrder>(`/purchase-orders/${id}/confirm`)
  },

  cancel(id: string): Promise<PurchaseOrder> {
    return http.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/purchase-orders/${id}`)
  },
}
