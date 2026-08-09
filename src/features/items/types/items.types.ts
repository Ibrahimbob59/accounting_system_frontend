// -----------------------------------------------------------------------------
// Domain types — confirmed against the backend's items.controller.ts, its DTOs
// (item-response.dto.ts, create-item.dto.ts, query-item.dto.ts) and
// prisma/schema.prisma. Enum members mirror the Prisma enums exactly.
// -----------------------------------------------------------------------------

/** VAT handling for an item's sales (backend TaxTreatment). STANDARD is taxed
 * at the rate, ZERO is 0%-rated (still reported), EXEMPT is outside VAT scope. */
export const TAX_TREATMENTS = ['STANDARD', 'ZERO', 'EXEMPT'] as const
export type TaxTreatment = (typeof TAX_TREATMENTS)[number]

export interface Item {
  id: string
  companyId: string
  code: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  description: string | null
  categoryId: string | null
  brandId: string | null
  familyId: string | null
  /** Stock is kept in this unit; required. */
  baseUomId: string
  salesUomId: string | null
  purchaseUomId: string | null
  costPrice: number
  salePrice: number
  priceCurrency: string
  vatTreatment: TaxTreatment
  defaultTaxRateId: string | null
  hasSize: boolean
  hasColour: boolean
  trackSerial: boolean
  trackExpiry: boolean
  /** Perpetual inventory: a stock item relieves stock + posts COGS on sale.
   * False for services / non-stock items (revenue + VAT only). */
  trackInventory: boolean
  /** Sales revenue account override (falls back to category, then company
   * REVENUE control). */
  revenueAccountId: string | null
  /** COGS account override (falls back to category, then company COGS control). */
  cogsAccountId: string | null
  imageUrls: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** `QueryItemDto` — list filter surface. `q` searches code + name. */
export interface ListItemsQuery {
  page?: number
  limit?: number
  categoryId?: string
  brandId?: string
  familyId?: string
  isActive?: boolean
  q?: string
}

/**
 * The item name for the active language, falling back to the base `name`.
 * Used in dense contexts (table rows, pickers); the detail page shows all three.
 */
export function localizedItemName(
  item: Pick<Item, 'name' | 'nameAr' | 'nameFr' | 'nameEn'>,
  language: string
): string {
  const byLanguage: Record<string, string | null> = {
    ar: item.nameAr,
    fr: item.nameFr,
    en: item.nameEn,
  }
  return byLanguage[language.split('-')[0]] || item.name
}
