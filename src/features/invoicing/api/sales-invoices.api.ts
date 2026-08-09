import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  ListSalesInvoicesQuery,
  SalesInvoice,
} from '@/features/invoicing/types/invoicing.types'

/** Sales invoices (backend FR-6xx). Phase 1 is read-only (list + single);
 *  create / confirm / delete land in a later phase. */
export const salesInvoicesApi = {
  list(query?: ListSalesInvoicesQuery): Promise<ApiSuccess<SalesInvoice[]>> {
    return http.getPage<SalesInvoice[]>('/sales-invoices', { params: query })
  },

  get(id: string): Promise<SalesInvoice> {
    return http.get<SalesInvoice>(`/sales-invoices/${id}`)
  },
}
