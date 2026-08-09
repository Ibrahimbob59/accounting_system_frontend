import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend's UoM error `code`s (uom.service.ts) to a message. */
const CODE_KEYS: Record<string, string> = {
  UOM_CATEGORY_IN_USE: 'errors.categoryInUse',
  UOM_REFERENCE_EXISTS: 'errors.referenceExists',
  UOM_FACTOR_REQUIRED: 'errors.factorRequired',
  UOM_CATEGORY_MISMATCH: 'errors.categoryMismatch',
  UOM_CATEGORY_NOT_FOUND: 'errors.categoryNotFound',
  UOM_NOT_FOUND: 'errors.notFound',
}

export function uomErrorMessage(error: unknown, t: TFunction<'uom'>): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
