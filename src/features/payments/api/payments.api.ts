import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreatePaymentInput,
  ListPaymentsQuery,
  OpenItem,
  Payment,
  PaymentDirection,
} from '@/features/payments/types/payments.types'

/** Payments (backend FR-801). A payment posts immediately (POSTED); voiding
 *  reverses its journal entry. Allocations settle open invoices/bills. */
export const paymentsApi = {
  list(query?: ListPaymentsQuery): Promise<ApiSuccess<Payment[]>> {
    return http.getPage<Payment[]>('/payments', { params: query })
  },

  get(id: string): Promise<Payment> {
    return http.get<Payment>(`/payments/${id}`)
  },

  create(dto: CreatePaymentInput): Promise<Payment> {
    return http.post<Payment>('/payments', dto)
  },

  void(id: string): Promise<Payment> {
    return http.post<Payment>(`/payments/${id}/void`)
  },

  openItems(
    partnerId: string,
    direction: PaymentDirection
  ): Promise<OpenItem[]> {
    return http.get<OpenItem[]>('/payments/open-items', {
      params: { partnerId, direction },
    })
  },
}
