// -----------------------------------------------------------------------------
// Invoicing domain types — confirmed against the backend's invoicing module
// (sales-invoices.controller + dto) and prisma schema. Phase 1 covers the read
// shapes for sales invoices; write DTOs and credit notes arrive in later phases.
// -----------------------------------------------------------------------------

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
