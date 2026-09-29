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

// -----------------------------------------------------------------------------
// Shared currency-presentation shapes (mirror the trial balance; reused by the
// VAT return, general ledger, income statement and balance sheet — all FR-903/905).
// -----------------------------------------------------------------------------

export interface PresentationRate {
  from: string
  rate: number
  rateType: string
  rateDate: string
}

/** The ?presentIn banner data shared by the statement reports. */
export interface ReportPresentation {
  currency: string
  converted: boolean
  rates: PresentationRate[]
}

// --- VAT return (FR-903) ---------------------------------------------------

export type VatDirection = 'PAYABLE' | 'RECOVERABLE' | 'NIL'

export interface VatReturnCurrencyGroup {
  currency: string
  outputVat: number
  inputVat: number
  netVat: number
  direction: VatDirection
}

export interface VatReturnPresentation extends ReportPresentation {
  outputVat: number | null
  inputVat: number | null
  netVat: number | null
  direction: VatDirection | null
}

export interface VatReturn {
  companyId: string
  from: string
  to: string
  currency: string | null
  outputVat: number | null
  inputVat: number | null
  netVat: number | null
  direction: VatDirection | null
  byBaseCurrency?: VatReturnCurrencyGroup[] | null
  presentation?: VatReturnPresentation | null
}

export interface VatReturnQuery {
  from: string
  to: string
  presentIn?: string
  rateType?: string
}

// --- general ledger (FR-905) -----------------------------------------------

export interface GeneralLedgerRow {
  date: string
  entryNumber: string | null
  description: string | null
  debit: number
  credit: number
  runningBalance: number
  partnerId: string | null
}

export interface GeneralLedgerCurrencyGroup {
  currency: string
  openingBalance: number
  rows: GeneralLedgerRow[]
  totalDebit: number
  totalCredit: number
  closingBalance: number
}

export interface GeneralLedger {
  companyId: string
  accountId: string
  accountNumber: string
  accountName: string
  from: string
  to: string
  currency: string | null
  openingBalance: number | null
  rows: GeneralLedgerRow[]
  totalDebit: number | null
  totalCredit: number | null
  closingBalance: number | null
  byBaseCurrency?: GeneralLedgerCurrencyGroup[] | null
  presentation?: ReportPresentation | null
}

export interface GeneralLedgerQuery {
  accountId: string
  from: string
  to: string
  presentIn?: string
  rateType?: string
}

// --- income statement & balance sheet (FR-905) -----------------------------

export interface StatementLine {
  accountId: string
  accountNumber: string
  accountName: string
  amount: number
}

export interface IncomeStatementCurrencyGroup {
  currency: string
  revenue: StatementLine[]
  totalRevenue: number
  expenses: StatementLine[]
  totalExpenses: number
  netResult: number
}

export interface IncomeStatement {
  companyId: string
  from: string
  to: string
  rolledUp: boolean
  currency: string | null
  revenue: StatementLine[]
  totalRevenue: number | null
  expenses: StatementLine[]
  totalExpenses: number | null
  netResult: number | null
  byBaseCurrency?: IncomeStatementCurrencyGroup[] | null
  presentation?: ReportPresentation | null
}

export interface IncomeStatementQuery {
  from: string
  to: string
  rollUp?: boolean
  presentIn?: string
  rateType?: string
}

export interface BalanceSheetCurrencyGroup {
  currency: string
  assets: StatementLine[]
  totalAssets: number
  liabilities: StatementLine[]
  totalLiabilities: number
  equity: StatementLine[]
  totalEquity: number
  isBalanced: boolean
}

export interface BalanceSheet {
  companyId: string
  asOf: string
  rolledUp: boolean
  currency: string | null
  assets: StatementLine[]
  totalAssets: number | null
  liabilities: StatementLine[]
  totalLiabilities: number | null
  equity: StatementLine[]
  totalEquity: number | null
  isBalanced: boolean
  byBaseCurrency?: BalanceSheetCurrencyGroup[] | null
  presentation?: ReportPresentation | null
}

export interface BalanceSheetQuery {
  asOf?: string
  rollUp?: boolean
  presentIn?: string
  rateType?: string
}
