import { useQuery } from '@tanstack/react-query'

import { reportsApi } from '@/features/reports/api/reports.api'
import type {
  BalanceSheetQuery,
  GeneralLedgerQuery,
  IncomeStatementQuery,
  VatReturnQuery,
} from '@/features/reports/types/reports.types'

export function useVatReturn(query: VatReturnQuery, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'vat-return', query],
    queryFn: () => reportsApi.vatReturn(query),
    enabled,
    placeholderData: (prev) => prev,
  })
}

export function useGeneralLedger(query: GeneralLedgerQuery, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'general-ledger', query],
    queryFn: () => reportsApi.generalLedger(query),
    enabled,
    placeholderData: (prev) => prev,
  })
}

export function useIncomeStatement(
  query: IncomeStatementQuery,
  enabled = true
) {
  return useQuery({
    queryKey: ['reports', 'income-statement', query],
    queryFn: () => reportsApi.incomeStatement(query),
    enabled,
    placeholderData: (prev) => prev,
  })
}

export function useBalanceSheet(query: BalanceSheetQuery) {
  return useQuery({
    queryKey: ['reports', 'balance-sheet', query],
    queryFn: () => reportsApi.balanceSheet(query),
    placeholderData: (prev) => prev,
  })
}
