import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend purchasing error `code`s to a message key. */
const CODE_KEYS: Record<string, string> = {
  PURCHASE_ORDER_NOT_FOUND: 'errors.poNotFound',
  PO_NOT_DRAFT: 'errors.poNotDraft',
  PO_NOT_CONFIRMED: 'errors.poNotConfirmed',
  PO_ALREADY_CANCELLED: 'errors.poCancelled',
  PO_LINE_MISMATCH: 'errors.poLineMismatch',
  PO_LINE_OVER_BILLED: 'errors.overBilled',
  RECEIVE_EXCEEDS_ORDERED: 'errors.receiveExceeds',
  GOODS_RECEIPT_NOT_FOUND: 'errors.receiptNotFound',
  VENDOR_BILL_NOT_FOUND: 'errors.billNotFound',
  BILL_NOT_DRAFT: 'errors.billNotDraft',
  BILL_POSTED: 'errors.billPosted',
  PARTNER_NOT_FOUND: 'errors.partnerNotFound',
  PARTNER_NOT_SUPPLIER: 'errors.partnerNotSupplier',
  ITEM_NOT_FOUND: 'errors.itemNotFound',
  VARIANT_REQUIRED: 'errors.variantRequired',
  UOM_NOT_FOUND: 'errors.uomNotFound',
  TAX_RATE_NOT_FOUND: 'errors.taxRateNotFound',
  LOCATION_INVALID: 'errors.locationInvalid',
  LOCATION_REQUIRED: 'errors.locationRequired',
  BRANCH_NOT_FOUND: 'errors.branchNotFound',
  AP_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  INVENTORY_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  VAT_IN_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  PERIOD_LOCKED: 'errors.periodLocked',
  INVALID_DATE: 'errors.invalidDate',
}

export function purchasingErrorMessage(
  error: unknown,
  t: TFunction<'purchasing'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
