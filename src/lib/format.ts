/**
 * Display formatting shared across features.
 *
 * Money lives here rather than inside whichever feature needed it first: the
 * moment a second screen formats an amount, a private copy is how two screens
 * start disagreeing about what a number looks like. This was originally a
 * local helper in PartnerLedgerTab.
 *
 * These are DISPLAY helpers only. Never do money arithmetic in the frontend —
 * totals, VAT, FX conversion and COGS are all server-computed per the
 * backend's accounting invariants (docs/API-CONTRACTS.md → Money fields).
 */

/** The subset of a Currency this module needs. Keeping it structural rather
 * than importing the full type avoids a lib→feature dependency. */
export interface CurrencyFormat {
  code: string
  decimalPlaces: number
}

/**
 * An amount with its currency code, e.g. "1,250.75 USD" or "1,250 LBP".
 *
 * `decimals` matters and is not cosmetic: LBP is a zero-decimal currency, so
 * "1,250.00 LBP" is wrong rather than merely verbose. Pass the currency's own
 * `decimalPlaces` (from the currencies registry) whenever it's known; the
 * 2-decimal default is only a fallback for when it isn't.
 *
 * Both bounds are set explicitly because `toLocaleString`'s default drops
 * trailing zeros — "1,250.5" instead of "1,250.50" — which reads as a typo in
 * a financial column and misaligns decimal points down the page.
 *
 * The currency code is appended rather than passed to `Intl`'s `currency`
 * style on purpose: these amounts are already expressed in a specific
 * currency, and `Intl` would re-symbolise them per the viewer's locale, so an
 * LBP amount could render with a completely different currency's symbol.
 */
export function formatAmount(
  amount: number,
  currency: string,
  options?: { locale?: string; decimals?: number }
): string {
  const decimals = options?.decimals ?? 2
  const formatted = amount.toLocaleString(options?.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return currency ? `${formatted} ${currency}` : formatted
}

/**
 * Formats an amount using a currency record, so the decimal places come from
 * the currency itself rather than a guess at the call site.
 *
 * `currency` is optional because the registry may still be loading, or the
 * caller may not know the currency yet — in that case the amount is rendered
 * unlabelled rather than with a wrong or invented code. An unlabelled number
 * is incomplete; a mislabelled one is a lie.
 */
export function formatMoney(
  amount: number,
  currency: CurrencyFormat | undefined,
  locale?: string
): string {
  return formatAmount(amount, currency?.code ?? '', {
    locale,
    decimals: currency?.decimalPlaces,
  })
}

/**
 * A calendar date in the active locale, e.g. "23 Jul 2026" / "٢٣ يوليو ٢٠٢٦".
 *
 * `month: 'short'` rather than a numeric date on purpose: "07/08/2026" is
 * read day-first in most of the app's locales and month-first in others, so a
 * spelled month removes the ambiguity in a financial record. Accepts either an
 * ISO string (what the API returns) or a Date.
 */
export function formatDate(value: string | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
