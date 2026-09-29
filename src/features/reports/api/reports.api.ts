import { http } from '@/lib/api-client'
import type {
  BalanceSheet,
  BalanceSheetQuery,
  GeneralLedger,
  GeneralLedgerQuery,
  IncomeStatement,
  IncomeStatementQuery,
  TrialBalance,
  TrialBalanceQuery,
  VatReturn,
  VatReturnQuery,
} from '@/features/reports/types/reports.types'

/** GL reports (backend FR-903/905). All are pure reads and currency-aware
 *  (uniform base, ?presentIn conversion, or a per-base-currency breakdown). */
export const reportsApi = {
  trialBalance(query?: TrialBalanceQuery): Promise<TrialBalance> {
    return http.get<TrialBalance>('/reports/trial-balance', { params: query })
  },

  vatReturn(query: VatReturnQuery): Promise<VatReturn> {
    return http.get<VatReturn>('/reports/vat-return', { params: query })
  },

  generalLedger(query: GeneralLedgerQuery): Promise<GeneralLedger> {
    return http.get<GeneralLedger>('/reports/general-ledger', { params: query })
  },

  incomeStatement(query: IncomeStatementQuery): Promise<IncomeStatement> {
    return http.get<IncomeStatement>('/reports/income-statement', {
      params: query,
    })
  },

  balanceSheet(query?: BalanceSheetQuery): Promise<BalanceSheet> {
    return http.get<BalanceSheet>('/reports/balance-sheet', { params: query })
  },
}
