import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateVendorBillInput,
  ListVendorBillsQuery,
  VendorBill,
} from '@/features/purchasing/types/purchasing.types'

/** Vendor bills (backend FR-501). A DRAFT is created, then confirmed (posts
 *  DR inventory/expense + DR input VAT, CR AP); a posted bill is immutable. */
export const vendorBillsApi = {
  list(query?: ListVendorBillsQuery): Promise<ApiSuccess<VendorBill[]>> {
    return http.getPage<VendorBill[]>('/vendor-bills', { params: query })
  },

  get(id: string): Promise<VendorBill> {
    return http.get<VendorBill>(`/vendor-bills/${id}`)
  },

  create(dto: CreateVendorBillInput): Promise<VendorBill> {
    return http.post<VendorBill>('/vendor-bills', dto)
  },

  confirm(id: string): Promise<VendorBill> {
    return http.post<VendorBill>(`/vendor-bills/${id}/confirm`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/vendor-bills/${id}`)
  },
}
