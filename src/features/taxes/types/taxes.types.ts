import type { TaxTreatment } from '@/features/items/types/items.types'

/** A VAT rate (backend taxes module: TaxRateResponseDto). Phase 1 reads these
 * only to resolve an item's default tax-rate name; the taxes settings screen
 * (and full shape) come later. */
export interface TaxRate {
  id: string
  companyId: string
  name: string
  ratePct: number
  treatment: TaxTreatment
  isActive: boolean
}
