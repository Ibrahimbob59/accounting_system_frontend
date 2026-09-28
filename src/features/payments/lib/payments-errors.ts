import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend payments service error `code`s to a message key. */
const CODE_KEYS: Record<string, string> = {
  PAYMENT_NOT_FOUND: 'errors.paymentNotFound',
  PAYMENT_ALREADY_VOID: 'errors.alreadyVoid',
  PARTNER_NOT_FOUND: 'errors.partnerNotFound',
  PARTNER_NOT_CUSTOMER: 'errors.partnerNotCustomer',
  PARTNER_NOT_SUPPLIER: 'errors.partnerNotSupplier',
  CASH_ACCOUNT_NOT_FOUND: 'errors.cashAccountNotFound',
  CASH_ACCOUNT_INVALID: 'errors.cashAccountInvalid',
  ALLOCATION_CURRENCY_MISMATCH: 'errors.allocationCurrencyMismatch',
  ALLOCATION_EXCEEDS_BALANCE: 'errors.allocationExceedsBalance',
  ALLOCATION_DOCUMENT_NOT_FOUND: 'errors.allocationDocumentNotFound',
  RECEIVABLE_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  PAYABLE_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  PERIOD_LOCKED: 'errors.periodLocked',
  INVALID_DATE: 'errors.invalidDate',
}

export function paymentsErrorMessage(
  error: unknown,
  t: TFunction<'payments'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
