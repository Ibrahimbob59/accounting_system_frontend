import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend's catalog error `code`s (catalog.service.ts) to a message. */
const CODE_KEYS: Record<string, string> = {
  LOOKUP_NAME_EXISTS: 'errors.nameExists',
  CATEGORY_HAS_CHILDREN: 'errors.hasChildren',
  PARENT_CATEGORY_NOT_FOUND: 'errors.parentNotFound',
  CATEGORY_CYCLE: 'errors.cycle',
  LOOKUP_NOT_FOUND: 'errors.notFound',
}

export function catalogErrorMessage(
  error: unknown,
  t: TFunction<'catalog'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
