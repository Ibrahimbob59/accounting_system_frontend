import { useAuthStore } from '@/features/auth/store/auth-store'
import { useCompanySettings } from '@/features/companies/hooks/useCompanySettings'
import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import type { Currency } from '@/features/currencies/types/currencies.types'

/**
 * The active company's base currency, as a full currency record.
 *
 * This is the piece that makes base-currency amounts renderable at all. Several
 * endpoints (`/accounts/:id/balance`, `/partners/:id/balance`) return plain
 * numbers already converted to the company's base currency, with no currency
 * field of their own — the code lives in company settings, and the decimal
 * places live in the currency registry. Without both, a balance can only be
 * shown as a bare unlabelled number.
 *
 * Returns `undefined` while either request is in flight or if the configured
 * code isn't in the registry. Callers must handle that by rendering the amount
 * unlabelled (see `formatMoney`) rather than substituting a default like USD —
 * showing the wrong currency on a financial figure is worse than showing none.
 */
export function useBaseCurrency(): Currency | undefined {
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const settings = useCompanySettings(activeCompanyId ?? undefined)
  const currencies = useCurrencies()

  const code = settings.data?.baseCurrencyCode
  if (!code) return undefined
  return currencies.data?.find((c) => c.code === code)
}
