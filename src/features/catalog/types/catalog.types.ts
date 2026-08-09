// -----------------------------------------------------------------------------
// Catalog lookups (backend catalog module: LookupResponseDto). Brands, families,
// sizes and colours are the "simple" lookups; item categories additionally carry
// a parent and the FR-6xx revenue/COGS posting-account overrides. Phase 1 only
// reads these (for item filters + name resolution); full CRUD arrives later.
// -----------------------------------------------------------------------------

export interface CatalogLookup {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  sortOrder: number
  /** Categories only. */
  parentId?: string | null
  /** Categories only — revenue account override. */
  revenueAccountId?: string | null
  /** Categories only — COGS account override. */
  cogsAccountId?: string | null
  createdAt: string
  updatedAt: string
}

/** The base path each lookup kind lives at (backend controllers). */
export const LOOKUP_PATHS = {
  itemCategory: 'item-categories',
  brand: 'brands',
  family: 'families',
  size: 'sizes',
  colour: 'colours',
} as const

export type LookupKind = keyof typeof LOOKUP_PATHS

/** Every lookup kind, in display order — categories first (the richest). */
export const LOOKUP_KINDS: LookupKind[] = [
  'itemCategory',
  'brand',
  'family',
  'size',
  'colour',
]

/**
 * Create/update payload. The simple lookups use only name + trilingual +
 * sortOrder; categories additionally accept parentId and the revenue/COGS
 * account overrides. Sending the category-only fields for a simple lookup is
 * harmless — the backend whitelists them off via its own DTOs.
 */
export interface CatalogLookupInput {
  name: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  sortOrder?: number
  parentId?: string
  revenueAccountId?: string
  cogsAccountId?: string
}

/** The localized lookup name for the active language, falling back to `name`. */
export function localizedLookupName(
  lookup: Pick<CatalogLookup, 'name' | 'nameAr' | 'nameFr' | 'nameEn'>,
  language: string
): string {
  const byLanguage: Record<string, string | null> = {
    ar: lookup.nameAr,
    fr: lookup.nameFr,
    en: lookup.nameEn,
  }
  return byLanguage[language.split('-')[0]] || lookup.name
}
