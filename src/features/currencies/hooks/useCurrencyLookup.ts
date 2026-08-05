import { useCallback } from 'react'

import { useCurrencies } from '@/features/currencies/hooks/useCurrencies'
import type { Currency } from '@/features/currencies/types/currencies.types'

/**
 * Resolves a currency code to its full record, so amounts can be formatted
 * with the right number of decimals rather than an assumed two.
 *
 * For any amount that carries its own currency code — a per-currency balance, a
 * transaction in its original currency, or a base-currency balance now that the
 * balance endpoints name their `currency`/`baseCurrency` in the payload.
 *
 * Returns `undefined` for an unknown code or while the registry loads —
 * `formatMoney` then renders the amount unlabelled rather than guessing.
 */
export function useCurrencyLookup(): (code: string) => Currency | undefined {
  const { data } = useCurrencies()
  return useCallback(
    (code: string) => data?.find((c) => c.code === code),
    [data]
  )
}
