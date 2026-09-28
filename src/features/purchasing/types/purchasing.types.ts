// -----------------------------------------------------------------------------
// Purchasing domain types — confirmed against the backend purchasing module
// (purchase-orders / goods-receipts / vendor-bills controllers + DTOs + prisma
// enums). PO → goods receipt → vendor bill. Totals, VAT, AVCO and the journal
// entry are computed server-side; the client sends only the header + lines.
// -----------------------------------------------------------------------------

import { z } from 'zod'
import type { TFunction } from 'i18next'

import type { TaxTreatment } from '@/features/items/types/items.types'

export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'BILLED',
  'CANCELLED',
] as const
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]

export const GOODS_RECEIPT_STATUSES = ['DRAFT', 'CONFIRMED'] as const
export type GoodsReceiptStatus = (typeof GOODS_RECEIPT_STATUSES)[number]

export const VENDOR_BILL_STATUSES = ['DRAFT', 'POSTED', 'CANCELLED'] as const
export type VendorBillStatus = (typeof VENDOR_BILL_STATUSES)[number]

// --- purchase orders -------------------------------------------------------

export interface PurchaseOrderLine {
  id: string
  lineNo: number
  itemId: string
  variantId: string | null
  uomId: string
  qtyOrdered: number
  qtyReceived: number
  unitCost: number
  taxRateId: string | null
  vatTreatment: TaxTreatment
  ratePct: number
  netAmount: number
  vatAmount: number
  totalAmount: number
  description: string | null
}

export interface PurchaseOrder {
  id: string
  companyId: string
  orderNo: string
  status: PurchaseOrderStatus
  supplierId: string
  branchId: string | null
  currencyCode: string
  rate: number
  orderDate: string
  expectedDate: string | null
  notes: string | null
  subtotal: number
  vatTotal: number
  grandTotal: number
  subtotalBase: number
  vatTotalBase: number
  grandTotalBase: number
  lines: PurchaseOrderLine[]
  createdAt: string
  updatedAt: string
}

export interface ListPurchaseOrdersQuery {
  page?: number
  limit?: number
  status?: PurchaseOrderStatus
  supplierId?: string
}

export interface CreatePurchaseOrderLineInput {
  itemId: string
  variantId?: string
  uomId?: string
  qtyOrdered: number
  unitCost?: number
  taxRateId?: string
  description?: string
}

export interface CreatePurchaseOrderInput {
  supplierId: string
  branchId?: string
  currencyCode: string
  rate?: number
  orderDate: string
  expectedDate?: string
  notes?: string
  lines: CreatePurchaseOrderLineInput[]
}

// --- goods receipts --------------------------------------------------------

export interface GoodsReceiptLine {
  id: string
  purchaseOrderLineId: string
  itemId: string
  variantId: string | null
  uomId: string
  qtyReceived: number
  unitCostBase: number
  stockMovementId: string | null
}

export interface GoodsReceipt {
  id: string
  companyId: string
  receiptNo: string
  status: GoodsReceiptStatus
  purchaseOrderId: string
  locationId: string
  branchId: string | null
  receiptDate: string
  notes: string | null
  lines: GoodsReceiptLine[]
  createdAt: string
}

export interface ListGoodsReceiptsQuery {
  page?: number
  limit?: number
  purchaseOrderId?: string
}

export interface ReceiveLineInput {
  purchaseOrderLineId: string
  qtyReceived: number
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string
  locationId: string
  branchId?: string
  receiptDate: string
  notes?: string
  lines: ReceiveLineInput[]
}

// --- vendor bills ----------------------------------------------------------

export interface VendorBillLine {
  id: string
  lineNo: number
  itemId: string
  variantId: string | null
  uomId: string
  qty: number
  unitCost: number
  taxRateId: string | null
  vatTreatment: TaxTreatment
  ratePct: number
  netAmount: number
  vatAmount: number
  totalAmount: number
  description: string | null
}

export interface VendorBill {
  id: string
  companyId: string
  billNo: string
  status: VendorBillStatus
  supplierId: string
  purchaseOrderId: string | null
  branchId: string | null
  currencyCode: string
  rate: number
  billDate: string
  dueDate: string | null
  supplierRef: string | null
  notes: string | null
  subtotal: number
  vatTotal: number
  grandTotal: number
  subtotalBase: number
  vatTotalBase: number
  grandTotalBase: number
  journalEntryId: string | null
  postedAt: string | null
  lines: VendorBillLine[]
  createdAt: string
  updatedAt: string
}

export interface ListVendorBillsQuery {
  page?: number
  limit?: number
  status?: VendorBillStatus
  supplierId?: string
}

export interface CreateVendorBillLineInput {
  itemId: string
  variantId?: string
  uomId?: string
  qty: number
  unitCost: number
  taxRateId?: string
  purchaseOrderLineId?: string
  description?: string
}

export interface CreateVendorBillInput {
  supplierId: string
  purchaseOrderId?: string
  branchId?: string
  currencyCode: string
  rate?: number
  billDate: string
  dueDate?: string
  supplierRef?: string
  notes?: string
  lines: CreateVendorBillLineInput[]
}

// --- form schemas ----------------------------------------------------------

export function makePurchaseOrderSchema(t: TFunction<'purchasing'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    qtyOrdered: z
      .number({ message: t('form.validation.qtyPositive') })
      .positive(t('form.validation.qtyPositive')),
    unitCost: z
      .number({ message: t('form.validation.costPositive') })
      .min(0, t('form.validation.costPositive'))
      .optional()
      .or(z.nan()),
    taxRateId: z.string().optional(),
    description: z.string().optional(),
  })
  return z.object({
    supplierId: z.string().min(1, t('form.validation.supplierRequired')),
    currencyCode: z.string().min(1, t('form.validation.currencyRequired')),
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    orderDate: z.string().min(1, t('form.validation.dateRequired')),
    expectedDate: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(line).min(1, t('form.validation.minLines')),
  })
}
export type PurchaseOrderFormValues = z.infer<
  ReturnType<typeof makePurchaseOrderSchema>
>

export function makeVendorBillSchema(t: TFunction<'purchasing'>) {
  const line = z.object({
    itemId: z.string().min(1, t('form.validation.itemRequired')),
    variantId: z.string().optional(),
    qty: z
      .number({ message: t('form.validation.qtyPositive') })
      .positive(t('form.validation.qtyPositive')),
    unitCost: z
      .number({ message: t('form.validation.costPositive') })
      .min(0, t('form.validation.costPositive')),
    taxRateId: z.string().optional(),
    purchaseOrderLineId: z.string().optional(),
    description: z.string().optional(),
  })
  return z.object({
    supplierId: z.string().min(1, t('form.validation.supplierRequired')),
    purchaseOrderId: z.string().optional(),
    currencyCode: z.string().min(1, t('form.validation.currencyRequired')),
    rate: z
      .number({ message: t('form.validation.ratePositive') })
      .positive(t('form.validation.ratePositive'))
      .optional()
      .or(z.nan()),
    billDate: z.string().min(1, t('form.validation.dateRequired')),
    dueDate: z.string().optional(),
    supplierRef: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(line).min(1, t('form.validation.minLines')),
  })
}
export type VendorBillFormValues = z.infer<
  ReturnType<typeof makeVendorBillSchema>
>
