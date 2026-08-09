import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend's invoicing error `code`s (sales-invoices /
 *  credit-notes service) to a message. */
const CODE_KEYS: Record<string, string> = {
  LOCATION_REQUIRED: 'errors.locationRequired',
  LOCATION_INVALID: 'errors.locationInvalid',
  INVOICE_NOT_DRAFT: 'errors.notDraft',
  INVOICE_POSTED: 'errors.posted',
  CREDIT_NOTE_NOT_DRAFT: 'errors.notDraft',
  CREDIT_NOTE_POSTED: 'errors.posted',
  SALES_INVOICE_NOT_FOUND: 'errors.invoiceNotFound',
  CREDIT_NOTE_NOT_FOUND: 'errors.creditNoteNotFound',
  ITEM_NOT_FOUND: 'errors.itemNotFound',
  VARIANT_REQUIRED: 'errors.variantRequired',
  TAX_RATE_NOT_FOUND: 'errors.taxRateNotFound',
  UOM_NOT_FOUND: 'errors.uomNotFound',
  PARTNER_NOT_FOUND: 'errors.partnerNotFound',
  PARTNER_NOT_CUSTOMER: 'errors.partnerNotCustomer',
  BRANCH_NOT_FOUND: 'errors.branchNotFound',
  INVALID_DATE: 'errors.invalidDate',
  VIRTUAL_LOCATION_MISSING: 'errors.virtualLocationMissing',
}

export function invoicingErrorMessage(
  error: unknown,
  t: TFunction<'invoicing'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
