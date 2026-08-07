import { useQuery } from '@tanstack/react-query'

import { reportsApi } from '@/features/reports/api/reports.api'
import type { TrialBalanceQuery } from '@/features/reports/types/reports.types'

export function useTrialBalance(query: TrialBalanceQuery) {
  return useQuery({
    queryKey: ['reports', 'trial-balance', query],
    queryFn: () => reportsApi.trialBalance(query),
    placeholderData: (prev) => prev,
  })
}
