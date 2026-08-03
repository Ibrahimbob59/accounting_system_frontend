/**
 * Global currency registry (backend `currencies` module). Currencies are
 * platform-level, not per-tenant — every company picks its base currency from
 * this same list.
 */
export interface Currency {
  code: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  symbol: string
  /**
   * How many decimal places this currency is written with. Load-bearing for
   * display: LBP is a 0-decimal currency, so rendering "1,250.00 LBP" is
   * wrong, not merely verbose. `formatAmount` takes this rather than assuming 2.
   */
  decimalPlaces: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
