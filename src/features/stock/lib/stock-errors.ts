import type { TFunction } from 'i18next'

import { ApiException } from '@/types/api'
import { isPermissionDenied } from '@/features/auth/lib/permissions'

/** Maps the backend's stock/location error `code`s to a message. Movement/
 *  operation codes are included ahead of Phase 2. */
const CODE_KEYS: Record<string, string> = {
  // Locations
  LOCATION_VIRTUAL_READONLY: 'errors.locationVirtualReadonly',
  LOCATION_IS_BRANCH_DEFAULT: 'errors.locationBranchDefault',
  LOCATION_NOT_FOUND: 'errors.locationNotFound',
  LOCATION_CODE_EXISTS: 'errors.locationCodeExists',
  // Movements / operations (Phase 2)
  MOVEMENT_SAME_LOCATION: 'errors.sameLocation',
  INSUFFICIENT_STOCK: 'errors.insufficientStock',
  UNIT_COST_REQUIRED: 'errors.unitCostRequired',
  ADJUSTMENT_NO_CHANGE: 'errors.adjustmentNoChange',
  VARIANT_REQUIRED_FOR_STOCK: 'errors.variantRequired',
  ITEM_HAS_NO_VARIANTS: 'errors.itemHasNoVariants',
  PARTNER_REQUIRED: 'errors.partnerRequired',
  ITEM_NOT_FOUND: 'errors.itemNotFound',
  VARIANT_NOT_FOUND: 'errors.variantNotFound',
  UOM_NOT_FOUND: 'errors.uomNotFound',
}

export function stockErrorMessage(
  error: unknown,
  t: TFunction<'stock'>
): string {
  if (isPermissionDenied(error)) return t('errors.permissionDenied')
  if (error instanceof ApiException && CODE_KEYS[error.code]) {
    return t(CODE_KEYS[error.code])
  }
  return t('errors.generic')
}
