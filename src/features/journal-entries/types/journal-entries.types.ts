import { z } from 'zod'
import type { TFunction } from 'i18next'

// -----------------------------------------------------------------------------
// Domain types — confirmed against the backend's journal-entries.controller.ts,
// its DTOs (journal-entry-response.dto.ts, journal-line.dto.ts), and
// prisma/schema.prisma. Enum members mirror the Prisma enums exactly.
// -----------------------------------------------------------------------------

/** A journal entry is DRAFT until posted; posting assigns its number and freezes
 * it. There is no separate "reversed" status — a reversal is its own POSTED
 * entry that points back via `reversalOfId`. */
export const JOURNAL_STATUSES = ['DRAFT', 'POSTED'] as const
export type JournalStatus = (typeof JOURNAL_STATUSES)[number]

export const JOURNAL_SIDES = ['DEBIT', 'CREDIT'] as const
export type JournalSide = (typeof JOURNAL_SIDES)[number]

/**
 * One posted/draft line. The 4-field Money shape is the backend's invariant:
 * `amountOriginal` in the line `currency`, `rate` (units per 1 USD), and
 * `amountBase` frozen at posting. The frontend only ever displays these — it
 * never recomputes `amountBase` (docs/API-CONTRACTS.md → Money fields).
 */
export interface JournalLine {
  id: string
  lineNo: number
  accountId: string
  side: JournalSide
  amountOriginal: number
  currency: string
  rate: number
  amountBase: number
  /** The currency `amountBase` is frozen in — self-describing, from the backend
   * (never the mutable company setting). Exposed as of the Phase 2 DTO change. */
  baseCurrencyCode: string
  partnerId: string | null
  costCenterId: string | null
  description: string | null
}

export interface JournalEntry {
  id: string
  companyId: string
  branchId: string | null
  /** Assigned at posting; null while draft. */
  entryNumber: string | null
  date: string
  reference: string | null
  description: string | null
  status: JournalStatus
  /** Set when this entry is itself the reversal of another entry. */
  reversalOfId: string | null
  /** Base currency of the totals, read from the lines (self-describing). Null
   * only in the rare mixed-base case (post a base-currency change). */
  baseCurrencyCode: string | null
  totalDebitBase: number
  totalCreditBase: number
  isBalanced: boolean
  lines: JournalLine[]
  postedAt: string | null
  createdAt: string
  updatedAt: string
}

/** `QueryJournalEntriesDto` — the list filter surface. */
export interface ListJournalEntriesQuery {
  page?: number
  limit?: number
  status?: JournalStatus
  dateFrom?: string
  dateTo?: string
  accountId?: string
}

// -----------------------------------------------------------------------------
// Write DTOs — the wire shapes for create / edit / reverse. `amountBase` is
// never sent: the server computes it from amountOriginal + rate (invariant #3).
// -----------------------------------------------------------------------------

export interface JournalLineInput {
  accountId: string
  side: JournalSide
  amountOriginal: number
  currency: string
  /** Optional: defaults server-side to the entry-date rate, or 1 in base. */
  rate?: number
  partnerId?: string
  description?: string
}

export interface CreateJournalEntryDto {
  date: string
  reference?: string
  description?: string
  lines: JournalLineInput[]
}

/** `PATCH /:id` — same shape; supplying `lines` replaces them wholesale. */
export type UpdateJournalEntryDto = Partial<CreateJournalEntryDto>

export interface ReverseJournalEntryDto {
  date?: string
  reason?: string
}

// -----------------------------------------------------------------------------
// Form schema (create / edit). Kept deliberately close to the backend's
// validation so the user gets inline errors rather than a 400 after submitting;
// the base-currency balance check stays server-side (it needs the FX rates).
// -----------------------------------------------------------------------------

export function makeJournalEntrySchema(t: TFunction<'journalEntries'>) {
  const line = z.object({
    accountId: z.string().min(1, t('form.validation.accountRequired')),
    side: z.enum(JOURNAL_SIDES),
    // `z.number()` with valueAsNumber: an empty field becomes NaN, which fails
    // the positive check with the right message rather than a type error.
    amountOriginal: z
      .number({ message: t('form.validation.amountPositive') })
      .positive(t('form.validation.amountPositive')),
    currency: z.string().min(1, t('form.validation.currencyRequired')),
    // Rate is optional: an empty field becomes NaN via valueAsNumber, which we
    // accept here (via `.or(z.nan())`) and strip to `undefined` at submit so the
    // server fills its default — but a real, present number must be positive.
    // Kept as a plain union (no transform) so the schema's input and output
    // types stay identical, which the react-hook-form resolver requires.
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    partnerId: z.string().optional(),
    description: z.string().optional(),
  })

  return z.object({
    date: z.string().min(1, t('form.validation.dateRequired')),
    reference: z.string().optional(),
    description: z.string().optional(),
    lines: z.array(line).min(2, t('form.validation.minLines')),
  })
}

export type JournalEntryFormValues = z.infer<
  ReturnType<typeof makeJournalEntrySchema>
>
