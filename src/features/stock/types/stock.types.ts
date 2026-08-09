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

// -----------------------------------------------------------------------------
// Movements + operations + valuation (Phase 2)
// -----------------------------------------------------------------------------

/** Why a movement happened (backend StockMovementType). RECEIPT/OPENING bring
 * stock in; ISSUE sends it out; TRANSFER is internal→internal; ADJUSTMENT
 * reconciles a physical count. */
export const MOVEMENT_TYPES = [
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'ADJUSTMENT',
  'OPENING',
] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export interface StockMovement {
  id: string
  companyId: string
  movementNo: string
  type: MovementType
  movementDate: string
  itemId: string
  variantId: string | null
  fromLocationId: string
  toLocationId: string
  partnerId: string | null
  qty: number
  unitCost: number
  value: number
  costCurrency: string
  reason: string | null
  reference: string | null
  branchId: string | null
  createdAt: string
}

export interface ListMovementsQuery {
  page?: number
  limit?: number
  itemId?: string
  variantId?: string
  locationId?: string
  partnerId?: string
  type?: MovementType
  from?: string
  to?: string
}

/** Count-based adjustment: state the counted qty; the server posts the delta. */
export interface AdjustStockInput {
  itemId: string
  variantId?: string
  locationId: string
  countedQty: number
  uomId?: string
  /** Required when the count is higher than on-hand (inbound). */
  unitCost?: number
  movementDate?: string
  reason?: string
}

/** Internal-to-internal transfer (value-neutral; quantity relocates). */
export interface TransferStockInput {
  itemId: string
  variantId?: string
  fromLocationId: string
  toLocationId: string
  qty: number
  uomId?: string
  movementDate?: string
  reason?: string
}

export interface ItemValuationRow {
  itemId: string
  qty: number
  value: number
}

export interface ValuationResult {
  asOf: string
  totalValue: number
  currency: string
  items: ItemValuationRow[]
}

// -----------------------------------------------------------------------------
// Item stock breakdown (GET /items/:itemId/stock) — Phase 3
// -----------------------------------------------------------------------------

export interface LocationStock {
  locationId: string
  locationCode: string
  qty: number
  value: number
}

export interface VariantStock {
  variantId: string | null
  qty: number
  value: number
  locations: LocationStock[]
}

export interface ItemStock {
  itemId: string
  totalQty: number
  totalValue: number
  currency: string
  breakdown: VariantStock[]
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
