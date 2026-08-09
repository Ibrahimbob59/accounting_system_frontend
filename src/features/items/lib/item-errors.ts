import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend's item error `code`s (items.service.ts) to a message. */
const CODE_KEYS: Record<string, string> = {
  ITEM_CODE_EXISTS: 'errors.codeExists',
  UOM_CATEGORY_MISMATCH: 'errors.uomCategoryMismatch',
  UOM_NOT_FOUND: 'errors.uomNotFound',
  LOOKUP_NOT_FOUND: 'errors.lookupNotFound',
  CURRENCY_NOT_FOUND: 'errors.currencyNotFound',
  TAX_RATE_NOT_FOUND: 'errors.taxRateNotFound',
  ITEM_NOT_FOUND: 'errors.notFound',
}

export function itemErrorMessage(
  error: unknown,
  t: TFunction<'items'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
