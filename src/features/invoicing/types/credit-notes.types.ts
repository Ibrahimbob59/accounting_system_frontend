// -----------------------------------------------------------------------------
// Credit notes — the mirror of sales invoices (backend invoicing module). A
// credit note reverses a sale: it credits the customer and restocks goods.
// -----------------------------------------------------------------------------

import { z } from 'zod'
import type { TFunction } from 'i18next'

import type { TaxTreatment } from '@/features/items/types/items.types'

export const CREDIT_NOTE_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type CreditNoteStatus = (typeof CREDIT_NOTE_STATUSES)[number]

export interface CreditNoteLine {
  id: string
  lineNo: number
  itemId: string
  variantId: string | null
  uomId: string
  qty: number
  unitPrice: number
  lineDiscountPct: number
  taxRateId: string | null
  vatTreatment: TaxTreatment
  ratePct: number
  netAmount: number
  vatAmount: number
  totalAmount: number
  costBase: number
  stockMovementId: string | null
  description: string | null
}

export interface CreditNote {
  id: string
  companyId: string
  creditNoteNo: string
  status: CreditNoteStatus
  customerId: string
  /** The sales invoice being credited, if any. */
  salesInvoiceId: string | null
  branchId: string | null
  locationId: string | null
  currencyCode: string
  rate: number
  creditNoteDate: string
  reason: string | null
  notes: string | null
  subtotal: number
  vatTotal: number
  grandTotal: number
  subtotalBase: number
  vatTotalBase: number
  grandTotalBase: number
  cogsTotalBase: number
  journalEntryId: string | null
  postedAt: string | null
  lines: CreditNoteLine[]
  createdAt: string
  updatedAt: string
}

export interface ListCreditNotesQuery {
  page?: number
  limit?: number
  status?: CreditNoteStatus
  customerId?: string
}

export interface CreateCreditNoteLineInput {
  itemId: string
  variantId?: string
  uomId?: string
  qty: number
  unitPrice?: number
  lineDiscountPct?: number
  taxRateId?: string
  description?: string
}

export interface CreateCreditNoteInput {
  customerId: string
  salesInvoiceId?: string
  branchId?: string
  locationId?: string
  currencyCode: string
  rate?: number
  creditNoteDate: string
  reason?: string
  notes?: string
  lines: CreateCreditNoteLineInput[]
}

export function makeCreditNoteSchema(t: TFunction<'invoicing'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    qty: z
      .number({ message: t('form.validation.qtyPositive') })
      .positive(t('form.validation.qtyPositive')),
    unitPrice: z
      .number({ message: t('form.validation.pricePositive') })
      .min(0, t('form.validation.pricePositive'))
      .optional()
      .or(z.nan()),
    lineDiscountPct: z
      .number({ message: t('form.validation.discountRange') })
      .min(0, t('form.validation.discountRange'))
      .max(100, t('form.validation.discountRange'))
      .optional()
      .or(z.nan()),
    taxRateId: z.string().optional(),
    description: z.string().optional(),
  })

  return z.object({
    customerId: z.string().min(1, t('form.validation.customerRequired')),
    salesInvoiceId: z.string().optional(),
    currencyCode: z.string().min(1, t('form.validation.currencyRequired')),
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    creditNoteDate: z.string().min(1, t('form.validation.dateRequired')),
    locationId: z.string().optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(line).min(1, t('form.validation.minLines')),
  })
}

export type CreditNoteFormValues = z.infer<
  ReturnType<typeof makeCreditNoteSchema>
>
