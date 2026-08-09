// -----------------------------------------------------------------------------
// Stock domain types — confirmed against the backend's stock module
// (locations.controller, stock.controller and their DTOs) and prisma schema.
// -----------------------------------------------------------------------------

/** INTERNAL is the only user-managed kind; the rest are seeded virtual
 * counterparties (customer/supplier/adjustment/transit) and are read-only. */
export const LOCATION_TYPES = [
  'INTERNAL',
  'CUSTOMER',
  'SUPPLIER',
  'ADJUSTMENT',
  'TRANSIT',
] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export interface StockLocation {
  id: string
  companyId: string
  code: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  type: LocationType
  branchId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateLocationInput {
  code: string
  name: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  branchId: string
  isActive?: boolean
}

/** `PATCH /locations/:id` — code is immutable; branch can be moved. */
export interface UpdateLocationInput {
  name?: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  branchId?: string
  isActive?: boolean
}

export interface ListLocationsQuery {
  type?: LocationType
  branchId?: string
}

// -----------------------------------------------------------------------------
// On-hand (bulk)
// -----------------------------------------------------------------------------

export type OnHandBreakdown = 'total' | 'byLocation'

export interface OnHandRow {
  itemId: string
  variantId: string | null
  /** Null for a total row; set for a byLocation row. */
  locationId: string | null
  locationCode: string | null
  qty: number
  avgCost: number
  value: number
  currency: string
}

export interface BulkOnHandQuery {
  itemIds?: string[]
  variantId?: string
  locationId?: string
  branchId?: string
  breakdown?: OnHandBreakdown
  includeZero?: boolean
  page?: number
  limit?: number
}

/** The localized location name for the active language, falling back to `name`. */
export function localizedLocationName(
  location: Pick<StockLocation, 'name' | 'nameAr' | 'nameFr' | 'nameEn'>,
  language: string
): string {
  const byLanguage: Record<string, string | null> = {
    ar: location.nameAr,
    fr: location.nameFr,
    en: location.nameEn,
  }
  return byLanguage[language.split('-')[0]] || location.name
}
