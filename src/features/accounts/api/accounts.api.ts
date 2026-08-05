import { http } from '@/lib/api-client'
import type { ApiSuccess } from '@/types/api'
import type {
  Account,
  AccountBalance,
  AccountTreeNode,
  CreateAccountDto,
  ImportChartResult,
  ListAccountsQuery,
  UpdateAccountDto,
} from '@/features/accounts/types/accounts.types'

/**
 * Chart of accounts (backend FR-104).
 *
 * `listAccounts` previously lived in partners.api.ts as an acknowledged
 * stopgap for the partner form's account picker, with a comment to move it
 * once a real Accounts feature existed. This is that feature — partners now
 * imports from here, so there's one accounts API rather than two that drift.
 */
export const accountsApi = {
  listAccounts(query?: ListAccountsQuery): Promise<ApiSuccess<Account[]>> {
    return http.getPage<Account[]>('/accounts', { params: query })
  },

  /** Nested server-side; no client-side tree assembly needed. */
  getTree(): Promise<AccountTreeNode[]> {
    return http.get<AccountTreeNode[]>('/accounts/tree')
  },

  getAccount(id: string): Promise<Account> {
    return http.get<Account>(`/accounts/${id}`)
  },

  /** `asOf` is an ISO date; omitted means "as of now". `presentIn` (a currency
   * code) asks the backend to convert the balance into that currency (Tier 2). */
  getBalance(
    id: string,
    asOf?: string,
    presentIn?: string
  ): Promise<AccountBalance> {
    const params: Record<string, string> = {}
    if (asOf) params.asOf = asOf
    if (presentIn) params.presentIn = presentIn
    return http.get<AccountBalance>(`/accounts/${id}/balance`, {
      params: Object.keys(params).length ? params : undefined,
    })
  },

  createAccount(dto: CreateAccountDto): Promise<Account> {
    return http.post<Account>('/accounts', dto)
  },

  updateAccount(id: string, dto: UpdateAccountDto): Promise<Account> {
    return http.patch<Account>(`/accounts/${id}`, dto)
  },

  /** Soft delete. The backend refuses if the account has children. */
  deleteAccount(id: string): Promise<void> {
    return http.delete<void>(`/accounts/${id}`)
  },

  /** Imports the full official Plan Comptable Libanais (759 accounts). Once
   * per company — the backend is the authority on that, not this call site. */
  importOfficialChart(): Promise<ImportChartResult> {
    return http.post<ImportChartResult>('/accounts/import-official')
  },
}
