// -----------------------------------------------------------------------------
// Invoicing domain types — confirmed against the backend's invoicing module
// (sales-invoices.controller + dto) and prisma schema. Phase 1 covers the read
// shapes for sales invoices; write DTOs and credit notes arrive in later phases.
// -----------------------------------------------------------------------------

import { z } from 'zod'
import type { TFunction } from 'i18next'

import type { TaxTreatment } from '@/features/items/types/items.types'

export const SALES_INVOICE_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type SalesInvoiceStatus = (typeof SALES_INVOICE_STATUSES)[number]

export interface SalesInvoiceLine {
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

export interface SalesInvoice {
  id: string
  companyId: string
  invoiceNo: string
  status: SalesInvoiceStatus
  customerId: string
  branchId: string | null
  locationId: string | null
  currencyCode: string
  rate: number
  invoiceDate: string
  dueDate: string | null
  customerRef: string | null
  notes: string | null
  /** Totals in the invoice (transaction) currency. */
  subtotal: number
  vatTotal: number
  grandTotal: number
  /** Totals converted to the company base currency (frozen at posting). */
  subtotalBase: number
  vatTotalBase: number
  grandTotalBase: number
  cogsTotalBase: number
  journalEntryId: string | null
  postedAt: string | null
  lines: SalesInvoiceLine[]
  createdAt: string
  updatedAt: string
}

export interface ListSalesInvoicesQuery {
  page?: number
  limit?: number
  status?: SalesInvoiceStatus
  customerId?: string
}

// -----------------------------------------------------------------------------
// Write DTOs + form schema (create). The invoice is created as a DRAFT and then
// confirmed; totals, VAT, COGS and the journal entry are all computed
// server-side, so the client never sends amounts beyond qty/price/discount.
// -----------------------------------------------------------------------------

export interface CreateSalesInvoiceLineInput {
  itemId: string
  variantId?: string
  uomId?: string
  qty: number
  unitPrice?: number
  lineDiscountPct?: number
  taxRateId?: string
  description?: string
}

export interface CreateSalesInvoiceInput {
  customerId: string
  branchId?: string
  locationId?: string
  currencyCode: string
  rate?: number
  invoiceDate: string
  dueDate?: string
  customerRef?: string
  notes?: string
  lines: CreateSalesInvoiceLineInput[]
}

export function makeSalesInvoiceSchema(t: TFunction<'invoicing'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    qty: z
      .number({ message: t('form.validation.qtyPositive') })
      .positive(t('form.validation.qtyPositive')),
    // Optional: empty → NaN via valueAsNumber; accepted here (falls back to the
    // item's sale price server-side) but a real value must be >= 0.
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
    currencyCode: z.string().min(1, t('form.validation.currencyRequired')),
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    invoiceDate: z.string().min(1, t('form.validation.dateRequired')),
    dueDate: z.string().optional(),
    locationId: z.string().optional(),
    customerRef: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(line).min(1, t('form.validation.minLines')),
  })
}

export type SalesInvoiceFormValues = z.infer<
  ReturnType<typeof makeSalesInvoiceSchema>
>
