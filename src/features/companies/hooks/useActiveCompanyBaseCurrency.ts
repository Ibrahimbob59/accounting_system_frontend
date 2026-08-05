import { useAuthStore } from '@/features/auth/store/auth-store'
import { useCompanySettings } from '@/features/companies/hooks/useCompanySettings'

/**
 * The active company's base-currency CODE, for use as `?presentIn=` so a balance
 * is *converted* — server-side, at real rates — into a single figure in the
 * company's currency.
 *
 * This is deliberately NOT the old `useBaseCurrency` (deleted): that one *labelled*
 * stored amounts from this mutable setting, which was the mislabel bug (a 100 USD
 * balance rendering as "100 LBP"). Here the code only asks the backend to convert;
 * the response still carries its own `currency` + rate + rateDate, and figures come
 * back null when no rate exists — so nothing is ever relabelled, only converted.
 *
 * `undefined` while settings load or for a platform admin (no active company) —
 * callers then simply don't request a conversion and show the self-describing base.
 */
export function useActiveCompanyBaseCurrency(): string | undefined {
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const { data } = useCompanySettings(activeCompanyId ?? undefined)
  return data?.baseCurrencyCode
}
