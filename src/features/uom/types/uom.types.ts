// -----------------------------------------------------------------------------
// Units of measure (backend uom module). Units convert only within a category;
// a REFERENCE unit has factor 1 (one per category), BIGGER/SMALLER units carry
// a factor (reference units per one of it). Phase 1 reads these for the item
// form pickers + id→name resolution; full CRUD arrives with the UoM screens.
// -----------------------------------------------------------------------------

export const UOM_TYPES = ['REFERENCE', 'BIGGER', 'SMALLER'] as const
export type UomType = (typeof UOM_TYPES)[number]

export interface Uom {
  id: string
  companyId: string
  categoryId: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  type: UomType
  factor: number
  rounding: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UomCategory {
  id: string
  companyId: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  createdAt: string
  updatedAt: string
}

/** The localized unit name for the active language, falling back to `name`. */
export function localizedUomName(
  uom: Pick<Uom, 'name' | 'nameAr' | 'nameFr' | 'nameEn'>,
  language: string
): string {
  const byLanguage: Record<string, string | null> = {
    ar: uom.nameAr,
    fr: uom.nameFr,
    en: uom.nameEn,
  }
  return byLanguage[language.split('-')[0]] || uom.name
}
