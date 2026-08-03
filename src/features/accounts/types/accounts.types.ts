import { z } from 'zod'
import type { TFunction } from 'i18next'

// -----------------------------------------------------------------------------
// Domain types — confirmed against the backend's accounts.controller.ts, its
// DTOs, and prisma/schema.prisma. Enum members mirror the Prisma enums exactly.
// -----------------------------------------------------------------------------

export const ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const NORMAL_BALANCES = ['DEBIT', 'CREDIT'] as const
export type NormalBalance = (typeof NORMAL_BALANCES)[number]

/** Control accounts are the fixed hooks the posting engine writes through —
 * AR/AP/VAT/cash/bank. Not free-form: the backend rejects invalid combinations
 * of `isControl` + `controlType`. */
export const CONTROL_TYPES = [
  'AR',
  'AP',
  'VAT_OUT',
  'VAT_IN',
  'CASH',
  'BANK',
] as const
export type ControlType = (typeof CONTROL_TYPES)[number]

export interface Account {
  id: string
  companyId: string
  number: string
  /** Base name. The trilingual fields below are additive, not replacements —
   * `name` is always populated, the others may be null. */
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  /** Plan Comptable Libanais class (1–7ish); the leading digit of `number`. */
  accountClass: number
  type: AccountType
  normalBalance: NormalBalance
  parentId: string | null
  /** ISO code when the account may only hold one currency, else null. */
  currencyRestriction: string | null
  isControl: boolean
  controlType: ControlType | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** `GET /accounts/tree` — the same shape, nested server-side. No client-side
 * tree assembly, which is why the tree view doesn't need the flat list. */
export interface AccountTreeNode extends Account {
  children: AccountTreeNode[]
}

/**
 * `GET /accounts/:id/balance` — derived from POSTED journal lines only.
 *
 * Note these are plain numbers already converted to the company's base
 * currency, NOT the backend's 4-field Money object; there's no per-currency
 * breakdown here (contrast PartnerBalance, which has `byCurrency`). So the
 * currency shown alongside them must come from company settings, not from
 * this response.
 */
export interface AccountBalance {
  accountId: string
  accountNumber: string
  accountName: string
  normalBalance: NormalBalance
  totalDebitBase: number
  totalCreditBase: number
  /** Signed: Σ debit − Σ credit, regardless of the account's normal side. */
  balance: number
  /** `balance` flipped so a normal-side balance reads positive. */
  naturalBalance: number
  asOf: string
}

/** `QueryAccountDto` — a real filter surface, unlike `GET /users`. Array params
 * (`accountClass`, `numberPrefix`) are serialised by axios as repeated keys. */
export interface ListAccountsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  type?: AccountType
  accountClass?: number[]
  numberPrefix?: string[]
  isControl?: boolean
  isActive?: boolean
  parentId?: string
}

export interface CreateAccountDto {
  number: string
  name: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  accountClass: number
  type: AccountType
  normalBalance: NormalBalance
  parentId?: string
  currencyRestriction?: string
  isControl?: boolean
  controlType?: ControlType
}

/** `UpdateAccountDto = PartialType(CreateAccountDto)` plus `isActive`, which is
 * how deactivation and re-parenting are both expressed. */
export type UpdateAccountDto = Partial<CreateAccountDto> & {
  isActive?: boolean
}

export interface ImportChartResult {
  imported: number
}

// -----------------------------------------------------------------------------
// Display helpers
// -----------------------------------------------------------------------------

/**
 * Depth-first flatten of the nested tree into a plain list.
 *
 * This is how anything needing EVERY account (pickers, comboboxes) should get
 * them. `GET /accounts` is paginated and its `limit` is capped at 100 by the
 * backend, so with the 759-account official chart no single list call can
 * return them all — whereas `GET /accounts/tree` ignores pagination and
 * returns the whole chart in one request.
 */
export function flattenAccountTree(nodes: AccountTreeNode[]): Account[] {
  const out: Account[] = []
  const walk = (list: AccountTreeNode[]) => {
    for (const node of list) {
      const { children, ...account } = node
      out.push(account)
      if (children?.length) walk(children)
    }
  }
  walk(nodes)
  return out
}

/**
 * The account name for the active language, falling back to the base `name`.
 *
 * Used in dense contexts (tree rows, table cells, comboboxes) where only one
 * name fits. The detail page shows all three explicitly instead — a 759-row
 * chart with three names per row is unreadable.
 */
export function localizedAccountName(
  account: Pick<Account, 'name' | 'nameAr' | 'nameFr' | 'nameEn'>,
  language: string
): string {
  const byLanguage: Record<string, string | null> = {
    ar: account.nameAr,
    fr: account.nameFr,
    en: account.nameEn,
  }
  return byLanguage[language.split('-')[0]] || account.name
}

// -----------------------------------------------------------------------------
// Form schema
// -----------------------------------------------------------------------------

export function makeAccountSchema(t: TFunction<'accounts'>) {
  return z
    .object({
      number: z.string().min(1, t('validation.required')),
      name: z.string().min(1, t('validation.required')),
      nameAr: z.string().optional(),
      nameFr: z.string().optional(),
      nameEn: z.string().optional(),
      // Plain `number`, not `z.coerce.number()`: coercion widens the schema's
      // INPUT type to `unknown`, which no longer matches the resolver's
      // expected form type. The field registers with `valueAsNumber` instead,
      // so react-hook-form does the string→number conversion before validation.
      accountClass: z
        .number({ message: t('validation.classRange') })
        .int()
        .min(1, t('validation.classRange'))
        .max(9, t('validation.classRange')),
      type: z.enum(ACCOUNT_TYPES),
      normalBalance: z.enum(NORMAL_BALANCES),
      parentId: z.string().optional(),
      currencyRestriction: z.string().optional(),
      isControl: z.boolean(),
      controlType: z.string().optional(),
    })
    // Mirrors the backend's control-flag validation so the user gets a field
    // error instead of a 400 after submitting.
    .refine((v) => !v.isControl || !!v.controlType, {
      message: t('validation.controlTypeRequired'),
      path: ['controlType'],
    })
}

export type AccountFormValues = z.infer<ReturnType<typeof makeAccountSchema>>
