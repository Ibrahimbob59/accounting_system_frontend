import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  Account,
  CreatePartnerDto,
  Currency,
  ListPartnersQuery,
  Partner,
  PartnerBalance,
  PartnerTransaction,
  PartnerTransactionsQuery,
  UpdatePartnerDto,
} from '@/features/partners/types/partners.types'

/**
 * `listCurrencies`/`listAccounts` don't belong to the partners domain, but
 * there's no currencies/accounts feature yet — same precedent as
 * dashboard.api.ts calling `/partners`/`/users`/`/accounts` directly. Move
 * these once real Currencies/Accounts modules exist.
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

  listCurrencies(): Promise<Currency[]> {
    return http.get<Currency[]>('/currencies')
  },

  listAccounts(): Promise<Account[]> {
    return http.get<Account[]>('/accounts')
  },
}
