import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/**
 * Maps the backend's stable error `code`s (gl.service.ts / posting.service.ts)
 * to a human message. Branching on the code, not the HTTP status, keeps this
 * aligned with how every other screen handles errors — and lets a specific,
 * fixable problem (unbalanced, missing rate, control account needs a partner)
 * say exactly what to do rather than a generic "something went wrong".
 */
const CODE_KEYS: Record<string, string> = {
  JOURNAL_ENTRY_UNBALANCED: 'errors.unbalanced',
  JOURNAL_ENTRY_EMPTY: 'errors.empty',
  ACCOUNT_NOT_FOUND: 'errors.accountNotFound',
  ACCOUNT_INACTIVE: 'errors.accountInactive',
  CONTROL_ACCOUNT_REQUIRES_PARTNER: 'errors.controlNeedsPartner',
  ACCOUNT_CURRENCY_MISMATCH: 'errors.currencyMismatch',
  JOURNAL_RATE_REQUIRED: 'errors.rateRequired',
  CURRENCY_NOT_FOUND: 'errors.currencyNotFound',
  BRANCH_NOT_FOUND: 'errors.branchNotFound',
  PARTNER_NOT_FOUND: 'errors.partnerNotFound',
  JOURNAL_ENTRY_NOT_DRAFT: 'errors.notDraft',
  JOURNAL_ENTRY_ALREADY_POSTED: 'errors.alreadyPosted',
  JOURNAL_ENTRY_NOT_POSTED: 'errors.notPosted',
  JOURNAL_ENTRY_ALREADY_REVERSED: 'errors.alreadyReversed',
  JOURNAL_ENTRY_NOT_FOUND: 'errors.notFound',
}

export function journalEntryErrorMessage(
  error: unknown,
  t: TFunction<'journalEntries'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
