// -----------------------------------------------------------------------------
// Payments domain types — confirmed against the backend payments module
// (payments.controller + payment.dto + prisma enums). Customer receipts (IN)
// and supplier payments (OUT), allocated against open sales invoices / vendor
// bills or left on account. Totals, FX gain/loss and the journal entry are all
// computed server-side; the client sends only the header + optional allocations.
// -----------------------------------------------------------------------------

import { z } from 'zod'
import type { TFunction } from 'i18next'

export const PAYMENT_DIRECTIONS = ['IN', 'OUT'] as const
export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[number]

export const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'CHEQUE',
  'TRANSFER',
  'PREPAID',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = ['POSTED', 'VOID'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** DocumentType values a payment can settle (backend Prisma enum subset). */
export type AllocationDocumentType = 'SALES_INVOICE' | 'VENDOR_BILL' | string

export interface PaymentAllocation {
  id: string
  documentType: AllocationDocumentType
  documentId: string
  amountOriginal: number
  amountBase: number
}

export interface Payment {
  id: string
  companyId: string
  paymentNo: string
  direction: PaymentDirection
  method: PaymentMethod
  status: PaymentStatus
  partnerId: string
  cashAccountId: string
  branchId: string | null
  currencyCode: string
  rate: number
  baseCurrencyCode: string
  amountOriginal: number
  amountBase: number
  reference: string | null
  paymentDate: string
  notes: string | null
  journalEntryId: string | null
  postedAt: string | null
  voidedAt: string | null
  allocations: PaymentAllocation[]
  createdAt: string
  updatedAt: string
}

/** One open document to settle — from GET /payments/open-items. */
export interface OpenItem {
  documentType: AllocationDocumentType
  documentId: string
  number: string
  date: string
  currencyCode: string
  grandTotal: number
  allocatedOriginal: number
  balanceOriginal: number
}

export interface ListPaymentsQuery {
  page?: number
  limit?: number
  direction?: PaymentDirection
  status?: PaymentStatus
  partnerId?: string
}

export interface CreatePaymentAllocationInput {
  documentId: string
  amount: number
}

export interface CreatePaymentInput {
  direction: PaymentDirection
  partnerId: string
  cashAccountId: string
  method: PaymentMethod
  branchId?: string
  currencyCode: string
  rate?: number
  amount: number
  paymentDate: string
  reference?: string
  notes?: string
  allocations?: CreatePaymentAllocationInput[]
}

// -----------------------------------------------------------------------------
// Form schema (header only). Allocations are managed as local component state
// because the open-item set loads asynchronously from the chosen partner.
// -----------------------------------------------------------------------------

export function makePaymentSchema(t: TFunction<'payments'>) {
  return z.object({
    direction: z.enum(PAYMENT_DIRECTIONS),
    partnerId: z.string().min(1, t('form.validation.partnerRequired')),
    cashAccountId: z.string().min(1, t('form.validation.cashAccountRequired')),
    method: z.enum(PAYMENT_METHODS),
    currencyCode: z.string().min(1, t('form.validation.currencyRequired')),
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    amount: z
      .number({ message: t('form.validation.amountPositive') })
      .positive(t('form.validation.amountPositive')),
    paymentDate: z.string().min(1, t('form.validation.dateRequired')),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
}

export type PaymentFormValues = z.infer<ReturnType<typeof makePaymentSchema>>
