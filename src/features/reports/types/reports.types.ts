// -----------------------------------------------------------------------------
// Trial balance (backend FR-905) — confirmed against reports.controller.ts,
// ledger.service.ts and trial-balance-response.dto.ts.
//
// The report is currency-aware. A trial balance only balances WITHIN one base
// currency, so the response comes back in one of three shapes:
//   - uniform base       → `currency` set, flat `rows` + `totalDebit/Credit`.
//   - `?presentIn` (ok)  → everything converted into that currency (flat rows +
//                          totals), `presentation.converted` true.
//   - mixed / no rate    → `currency` null, `byBaseCurrency[]` carries one
//                          balanced trial balance per stored base currency.
// -----------------------------------------------------------------------------

export interface TrialBalanceRow {
  /** Empty on a rolled-up (group) row. */
  accountId: string
  /** Account number, or the group key (prefix/class) when rolled up. */
  accountNumber: string
  accountName: string
  debit: number
  credit: number
}

/** The rate used to convert one source base currency into the presentation
 *  currency (?presentIn). */
export interface TrialBalancePresentationRate {
  from: string
  rate: number
  rateType: string
  rateDate: string
}

/** One self-contained, balanced trial balance in a single base currency. */
export interface TrialBalanceCurrencyGroup {
  currency: string
  rows: TrialBalanceRow[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

/** Echoes the ?presentIn conversion: target currency, rates used, and whether
 *  every source currency could be converted. */
export interface TrialBalancePresentation {
  currency: string
  converted: boolean
  rates: TrialBalancePresentationRate[]
}

export interface TrialBalance {
  companyId: string
  asOf: string
  /** Base currency of the flat rows/totals. Null when the scope spans more than
   * one base currency and no usable ?presentIn was applied. */
  currency: string | null
  rolledUp: boolean
  rows: TrialBalanceRow[]
  totalDebit: number | null
  totalCredit: number | null
  isBalanced: boolean
  /** One balanced trial balance per base currency; present only for a mixed
   * scope viewed without a usable ?presentIn. */
  byBaseCurrency?: TrialBalanceCurrencyGroup[] | null
  /** Present only when ?presentIn was requested. */
  presentation?: TrialBalancePresentation | null
}

export interface TrialBalanceQuery {
  asOf?: string
  /** One or more account-number prefixes — restricts the report to those PCL
   * sub-trees (e.g. ['6','7'] for the P&L accounts). Serialised as repeated
   * query keys by axios. */
  numberPrefix?: string[]
  /** Roll up into one summary line per group (per prefix, else per PCL class). */
  rollUp?: boolean
  /** Present every amount converted into this currency (Tier 2). */
  presentIn?: string
  /** Rate type for the ?presentIn conversion (default Official). */
  rateType?: string
}
