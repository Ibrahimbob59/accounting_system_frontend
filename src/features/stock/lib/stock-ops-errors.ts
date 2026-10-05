import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend stock-count / stock-transfer error `code`s to a message. */
const CODE_KEYS: Record<string, string> = {
  STOCK_COUNT_NOT_FOUND: 'errors.countNotFound',
  COUNT_NOT_DRAFT: 'errors.countNotDraft',
  COUNT_POSTED: 'errors.countPosted',
  STOCK_TRANSFER_NOT_FOUND: 'errors.transferNotFound',
  TRANSFER_NOT_DRAFT: 'errors.transferNotDraft',
  TRANSFER_NOT_POSTABLE: 'errors.transferNotPostable',
  TRANSFER_POSTED: 'errors.transferPosted',
  TRANSFER_SAME_LOCATION: 'errors.sameLocation',
  INSUFFICIENT_STOCK: 'errors.insufficientStock',
  LOCATION_INVALID: 'errors.locationInvalid',
  ITEM_NOT_FOUND: 'errors.itemNotFound',
  VARIANT_REQUIRED: 'errors.variantRequired',
  ITEM_HAS_NO_VARIANTS: 'errors.itemHasNoVariants',
  VARIANT_NOT_FOUND: 'errors.variantNotFound',
  BRANCH_NOT_FOUND: 'errors.branchNotFound',
  VIRTUAL_LOCATION_MISSING: 'errors.adjustmentLocationMissing',
  INVENTORY_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  INVENTORY_ADJUSTMENT_ACCOUNT_MISSING: 'errors.controlAccountMissing',
  PERIOD_LOCKED: 'errors.periodLocked',
  INVALID_DATE: 'errors.invalidDate',
}

export function stockOpsErrorMessage(
  error: unknown,
  t: TFunction<'stockOps'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
