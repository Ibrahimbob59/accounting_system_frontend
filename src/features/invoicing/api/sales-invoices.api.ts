import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreateSalesInvoiceInput,
  ListSalesInvoicesQuery,
  SalesInvoice,
} from '@/features/invoicing/types/invoicing.types'

/** Sales invoices (backend FR-6xx). A DRAFT is created, then confirmed
 *  (posted); a posted invoice is immutable. */
export const salesInvoicesApi = {
  list(query?: ListSalesInvoicesQuery): Promise<ApiSuccess<SalesInvoice[]>> {
    return http.getPage<SalesInvoice[]>('/sales-invoices', { params: query })
  },

  get(id: string): Promise<SalesInvoice> {
    return http.get<SalesInvoice>(`/sales-invoices/${id}`)
  },

  create(dto: CreateSalesInvoiceInput): Promise<SalesInvoice> {
    return http.post<SalesInvoice>('/sales-invoices', dto)
  },

  confirm(id: string): Promise<SalesInvoice> {
    return http.post<SalesInvoice>(`/sales-invoices/${id}/confirm`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/sales-invoices/${id}`)
  },
}
