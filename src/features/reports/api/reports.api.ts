import { http } from '@/lib/api-client'
import type {
  TrialBalance,
  TrialBalanceQuery,
} from '@/features/reports/types/reports.types'

/** GL reports (backend FR-9xx). Trial balance today; P&L / balance sheet land
 * here as the backend exposes them. */
export const reportsApi = {
  trialBalance(query?: TrialBalanceQuery): Promise<TrialBalance> {
    return http.get<TrialBalance>('/reports/trial-balance', {
      params: query,
    })
  },
}
