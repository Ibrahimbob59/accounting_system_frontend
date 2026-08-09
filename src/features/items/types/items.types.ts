import { z } from 'zod'
import type { TFunction } from 'i18next'

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

// -----------------------------------------------------------------------------
// Write DTOs — the wire shapes for create / edit. Every optional reference is a
// UUID or omitted; the backend defaults costPrice/salePrice to 0, priceCurrency
// to the company base, and the flags to their documented defaults.
// -----------------------------------------------------------------------------

export interface CreateItemDto {
  code: string
  name: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  description?: string
  categoryId?: string
  brandId?: string
  familyId?: string
  baseUomId: string
  salesUomId?: string
  purchaseUomId?: string
  costPrice?: number
  salePrice?: number
  priceCurrency?: string
  vatTreatment?: TaxTreatment
  defaultTaxRateId?: string
  hasSize?: boolean
  hasColour?: boolean
  trackSerial?: boolean
  trackExpiry?: boolean
  trackInventory?: boolean
  revenueAccountId?: string
  cogsAccountId?: string
  isActive?: boolean
}

export type UpdateItemDto = Partial<CreateItemDto>

// -----------------------------------------------------------------------------
// Form schema (create / edit). Mirrors the backend's validation so the user gets
// inline errors instead of a 400; cross-field rules the client can't check
// (UoM category match) stay server-side and surface via the error mapper.
// -----------------------------------------------------------------------------

export function makeItemSchema(t: TFunction<'items'>) {
  // Optional price: empty field → NaN via valueAsNumber; accept that (stripped
  // to the server default at submit) but reject a real negative number. Union
  // (no transform) so the schema's input and output types stay identical.
  const price = z
    .number({ message: t('form.validation.pricePositive') })
    .min(0, t('form.validation.pricePositive'))
    .optional()
    .or(z.nan())

  return z.object({
    code: z.string().min(1, t('form.validation.required')),
    name: z.string().min(1, t('form.validation.required')),
    nameAr: z.string().optional(),
    nameFr: z.string().optional(),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    familyId: z.string().optional(),
    baseUomId: z.string().min(1, t('form.validation.baseUomRequired')),
    salesUomId: z.string().optional(),
    purchaseUomId: z.string().optional(),
    costPrice: price,
    salePrice: price,
    priceCurrency: z.string().optional(),
    vatTreatment: z.enum(TAX_TREATMENTS),
    defaultTaxRateId: z.string().optional(),
    hasSize: z.boolean(),
    hasColour: z.boolean(),
    trackSerial: z.boolean(),
    trackExpiry: z.boolean(),
    trackInventory: z.boolean(),
    revenueAccountId: z.string().optional(),
    cogsAccountId: z.string().optional(),
    isActive: z.boolean(),
  })
}

export type ItemFormValues = z.infer<ReturnType<typeof makeItemSchema>>

// -----------------------------------------------------------------------------
// Variants & barcodes (backend items sub-resources). A variant is one
// size/colour combination of an item; a barcode maps a code to the item or one
// of its variants.
// -----------------------------------------------------------------------------

export interface ItemVariant {
  id: string
  itemId: string
  sizeId: string | null
  colourId: string | null
  sku: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Create one variant — at least one of size/colour is required. */
export interface VariantInput {
  sizeId?: string
  colourId?: string
  sku?: string
}

/** Generate the size × colour matrix; existing combinations are skipped. */
export interface GenerateVariantsInput {
  sizeIds?: string[]
  colourIds?: string[]
}

export interface GenerateResult {
  created: number
  skipped: number
}

export interface ItemBarcode {
  id: string
  itemId: string
  variantId: string | null
  barcode: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface BarcodeInput {
  barcode: string
  variantId?: string
  isPrimary?: boolean
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
