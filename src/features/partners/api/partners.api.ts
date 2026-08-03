import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  CreatePartnerDto,
  ListPartnersQuery,
  Partner,
  PartnerBalance,
  PartnerTransaction,
  PartnerTransactionsQuery,
  UpdatePartnerDto,
} from '@/features/partners/types/partners.types'

/**
 * Partners only. `listAccounts` and `listCurrencies` used to live here as
 * stopgaps; both have since moved to their own features (features/accounts,
 * features/currencies), which partners imports from.
 */
export const partnersApi = {
  listPartners(query: ListPartnersQuery): Promise<ApiSuccess<Partner[]>> {
    return http.getPage<Partner[]>('/partners', { params: query })
  },

  getPartner(id: string): Promise<Partner> {
    return http.get<Partner>(`/partners/${id}`)
  },

  createPartner(dto: CreatePartnerDto): Promise<Partner> {
    return http.post<Partner>('/partners', dto)
  },

  updatePartner(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    return http.patch<Partner>(`/partners/${id}`, dto)
  },

  deletePartner(id: string): Promise<void> {
    return http.delete<void>(`/partners/${id}`)
  },

  getPartnerBalance(id: string, asOf?: string): Promise<PartnerBalance> {
    return http.get<PartnerBalance>(`/partners/${id}/balance`, {
      params: asOf ? { asOf } : undefined,
    })
  },

  getPartnerTransactions(
    id: string,
    query: PartnerTransactionsQuery
  ): Promise<ApiSuccess<PartnerTransaction[]>> {
    return http.getPage<PartnerTransaction[]>(`/partners/${id}/transactions`, {
      params: query,
    })
  },
}
