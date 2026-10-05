// -----------------------------------------------------------------------------
// Stock counts (FR-403) & inter-branch transfers (FR-404) — confirmed against
// the backend stock-counts / stock-transfers controllers + DTOs. Documents with
// a draft→posted lifecycle; a count's variance posts adjustment movements + one
// journal, a transfer moves stock value-neutrally between internal locations.
// -----------------------------------------------------------------------------

import { z } from 'zod'
import type { TFunction } from 'i18next'

export const STOCK_COUNT_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type StockCountStatus = (typeof STOCK_COUNT_STATUSES)[number]

export const STOCK_TRANSFER_STATUSES = [
  'DRAFT',
  'APPROVED',
  'POSTED',
  'CANCELLED',
] as const
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number]

// --- stock counts ----------------------------------------------------------

export interface StockCountLine {
  id: string
  lineNo: number
  itemId: string
  variantId: string | null
  uomId: string | null
  /** On-hand snapshot at creation (base UoM). */
  systemQty: number
  countedQty: number
  unitCost: number | null
  /** counted − current on-hand, frozen at post. */
  varianceQty: number
  varianceValueBase: number
  stockMovementId: string | null
}

export interface StockCount {
  id: string
  companyId: string
  countNo: string
  status: StockCountStatus
  countDate: string
  branchId: string | null
  locationId: string
  notes: string | null
  /** Net variance value posted to the ledger (base), frozen at post. */
  varianceValueBase: number
  journalEntryId: string | null
  postedAt: string | null
  createdAt: string
  lines?: StockCountLine[]
}

export interface ListStockCountsQuery {
  page?: number
  limit?: number
  status?: StockCountStatus
  locationId?: string
}

export interface CreateStockCountLineInput {
  itemId: string
  variantId?: string
  countedQty: number
  unitCost?: number
}

export interface CreateStockCountInput {
  locationId: string
  countDate?: string
  branchId?: string
  notes?: string
  lines: CreateStockCountLineInput[]
}

// --- stock transfers -------------------------------------------------------

export interface StockTransferLine {
  id: string
  lineNo: number
  itemId: string
  variantId: string | null
  uomId: string | null
  qty: number
  stockMovementId: string | null
}

export interface StockTransfer {
  id: string
  companyId: string
  transferNo: string
  status: StockTransferStatus
  transferDate: string
  fromLocationId: string
  toLocationId: string
  fromBranchId: string | null
  toBranchId: string | null
  notes: string | null
  approvedById: string | null
  approvedAt: string | null
  postedAt: string | null
  createdAt: string
  lines?: StockTransferLine[]
}

export interface ListStockTransfersQuery {
  page?: number
  limit?: number
  status?: StockTransferStatus
}

export interface CreateStockTransferLineInput {
  itemId: string
  variantId?: string
  qty: number
}

export interface CreateStockTransferInput {
  fromLocationId: string
  toLocationId: string
  transferDate?: string
  notes?: string
  lines: CreateStockTransferLineInput[]
}

// --- form schemas ----------------------------------------------------------

export function makeStockCountSchema(t: TFunction<'stockOps'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    countedQty: z
      .number({ message: t('form.validation.qtyNonNegative') })
      .min(0, t('form.validation.qtyNonNegative')),
    unitCost: z
      .number({ message: t('form.validation.costNonNegative') })
      .min(0, t('form.validation.costNonNegative'))
      .optional()
      .or(z.nan()),
  })
  return z.object({
    locationId: z.string().min(1, t('form.validation.locationRequired')),
    countDate: z.string().min(1, t('form.validation.dateRequired')),
    notes: z.string().optional(),
    lines: z.array(line).min(1, t('form.validation.minLines')),
  })
}
export type StockCountFormValues = z.infer<
  ReturnType<typeof makeStockCountSchema>
>

export function makeStockTransferSchema(t: TFunction<'stockOps'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    qty: z
      .number({ message: t('form.validation.qtyPositive') })
      .positive(t('form.validation.qtyPositive')),
  })
  return z
    .object({
      fromLocationId: z.string().min(1, t('form.validation.fromRequired')),
      toLocationId: z.string().min(1, t('form.validation.toRequired')),
      transferDate: z.string().min(1, t('form.validation.dateRequired')),
      notes: z.string().optional(),
      lines: z.array(line).min(1, t('form.validation.minLines')),
    })
    .refine((v) => v.fromLocationId !== v.toLocationId, {
      message: t('form.validation.sameLocation'),
      path: ['toLocationId'],
    })
}
export type StockTransferFormValues = z.infer<
  ReturnType<typeof makeStockTransferSchema>
>
