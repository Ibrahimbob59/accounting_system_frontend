import { isPermissionDenied } from '@/features/auth/lib/permissions'
import { ApiException } from '@/types/api'

/**
 * Maps the account-specific `ApiException.code`s to translated messages,
 * shared by the create and edit pages.
 *
 * Its own module rather than an export from a page component: exporting a
 * non-component from a component file breaks React Fast Refresh (the whole
 * module gets remounted instead of hot-swapped), which the lint rule
 * `react-refresh/only-export-components` enforces.
 *
 * Each code here is a mistake the user can actually correct — a duplicate
 * number, a parent that would form a loop, an illegal control-flag pairing.
 * Anything else falls through to the generic message rather than guessing.
 */
export function accountErrorMessage(
  err: unknown,
  t: (key: string) => string
): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'ACCOUNT_NUMBER_EXISTS':
        return t('errors.numberExists')
      case 'ACCOUNT_PARENT_CYCLE':
        return t('errors.parentCycle')
      case 'ACCOUNT_INVALID_CONTROL':
        return t('errors.invalidControl')
    }
  }
  return isPermissionDenied(err)
    ? t('errors.permissionDenied')
    : t('errors.generic')
}
