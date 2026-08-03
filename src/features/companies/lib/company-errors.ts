import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { ApiException } from '@/types/api'

/**
 * Company-specific error codes, shared by the create and edit pages.
 *
 * Its own module so neither page exports a non-component, which would break
 * React Fast Refresh (`react-refresh/only-export-components`).
 */
export function companyErrorMessage(
  err: unknown,
  t: (key: string) => string
): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'COMPANY_NAME_EXISTS':
        return t('errors.nameExists')
      case 'CURRENCY_NOT_FOUND':
        return t('errors.currencyNotFound')
    }
  }
  return isPermissionDenied(err)
    ? t('errors.permissionDenied')
    : t('errors.generic')
}
