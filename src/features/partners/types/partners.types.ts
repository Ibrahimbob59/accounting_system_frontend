import { z } from 'zod'
import type { TFunction } from 'i18next'

// -----------------------------------------------------------------------------
// Domain types — confirmed from the backend's partners.controller.ts /
// partners.service.ts / DTOs (see frontend-partners-module-instructions.md).
// regionId/salesmanId are deliberately omitted everywhere: the backend itself
// documents them as passthrough ids with no lookup model yet, so a raw UUID
// text input would imply a real picker that doesn't exist.
// -----------------------------------------------------------------------------

export type PartnerAddressType = 'BILLING' | 'SHIPPING' | 'BRANCH'

export interface PartnerAddress {
  id: string
  type: PartnerAddressType
  line1: string
  city: string | null
  country: string | null
  region: string | null
  phone: string | null
  isDefault: boolean
}

export interface Partner {
  id: string
  companyId: string
  ref: string
  name: string
  nameAr: string | null
  nameFr: string | null
  nameEn: string | null
  isCustomer: boolean
  isSupplier: boolean
  category: string | null
  tin: string | null
  contactName: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  vip: boolean
  creditLimit: number | null
  creditCurrency: string | null
  receivableAccountId: string | null
  payableAccountId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  addresses?: PartnerAddress[]
}

export interface PartnerCurrencyBalance {
  currency: string
  debit: number
  credit: number
  net: number
}

export interface PartnerBalance {
  partnerId: string
  ref: string
  name: string
  asOf: string
  totalDebitBase: number
  totalCreditBase: number
  balanceBase: number
  byCurrency: PartnerCurrencyBalance[]
}

export interface PartnerTransaction {
  lineId: string
  journalEntryId: string
  entryNumber: string | null
  date: string
  reference: string | null
  description: string | null
  accountId: string
  side: 'DEBIT' | 'CREDIT'
  amountOriginal: number
  currency: string
  amountBase: number
}

/** Minimal shape consumed from the real, existing `GET /currencies`. */
/** Minimal shape consumed from `GET /accounts` for the read-only §3.5 combobox. */
// -----------------------------------------------------------------------------
// Requests
// -----------------------------------------------------------------------------

export interface ListPartnersQuery {
  isCustomer?: boolean
  isSupplier?: boolean
  isActive?: boolean
  q?: string
  sortBy?: 'ref' | 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PartnerTransactionsQuery {
  page?: number
  limit?: number
}

export interface PartnerAddressInput {
  type: PartnerAddressType
  line1: string
  city?: string
  country?: string
  region?: string
  phone?: string
  isDefault?: boolean
}

export interface CreatePartnerDto {
  ref?: string
  name: string
  nameAr?: string
  nameFr?: string
  nameEn?: string
  isCustomer: boolean
  isSupplier: boolean
  category?: string
  tin?: string
  contactName?: string
  phone?: string
  phone2?: string
  email?: string
  vip?: boolean
  creditLimit?: number
  creditCurrency?: string
  receivableAccountId?: string
  payableAccountId?: string
  /** Supplying this on update REPLACES the partner's full address set. */
  addresses?: PartnerAddressInput[]
}

export type UpdatePartnerDto = Partial<CreatePartnerDto> & { isActive?: boolean }

// -----------------------------------------------------------------------------
// Form schema — react-hook-form values are all strings/booleans (native
// inputs), coerced into CreatePartnerDto/UpdatePartnerDto only in the submit
// handler, per CONVENTIONS.md's form conventions.
// -----------------------------------------------------------------------------

export interface PartnerAddressFormRow {
  type: PartnerAddressType
  line1: string
  city: string
  country: string
  region: string
  phone: string
  isDefault: boolean
}

export function makeAddressRow(
  overrides: Partial<PartnerAddressFormRow> = {}
): PartnerAddressFormRow {
  return {
    type: 'BILLING',
    line1: '',
    city: '',
    country: '',
    region: '',
    phone: '',
    isDefault: false,
    ...overrides,
  }
}

export function makePartnerFormSchema(t: TFunction<'partners'>) {
  const optional = (max: number) =>
    z.string().trim().max(max).optional().or(z.literal(''))

  const addressSchema = z.object({
    type: z.enum(['BILLING', 'SHIPPING', 'BRANCH']),
    line1: z.string().trim().min(1, t('validation.required')).max(255),
    city: optional(120),
    country: optional(120),
    region: optional(120),
    phone: optional(50),
    isDefault: z.boolean(),
  })

  return z
    .object({
      isCustomer: z.boolean(),
      isSupplier: z.boolean(),
      name: z.string().trim().min(1, t('validation.required')).max(255),
      nameAr: optional(255),
      nameFr: optional(255),
      nameEn: optional(255),
      ref: optional(50),
      category: optional(120),
      tin: optional(50),
      contactName: optional(255),
      phone: optional(50),
      phone2: optional(50),
      email: z
        .string()
        .trim()
        .max(255)
        .email(t('validation.emailInvalid'))
        .optional()
        .or(z.literal('')),
      vip: z.boolean(),
      creditLimit: z
        .string()
        .trim()
        .optional()
        .or(z.literal(''))
        .refine(
          (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
          t('validation.creditLimitInvalid')
        ),
      creditCurrency: optional(10),
      receivableAccountId: optional(64),
      payableAccountId: optional(64),
      addresses: z.array(addressSchema),
    })
    .refine((data) => data.isCustomer || data.isSupplier, {
      message: t('validation.roleRequired'),
      path: ['isCustomer'],
    })
    .refine(
      (data) => data.addresses.filter((a) => a.isDefault).length <= 1,
      { message: t('validation.singleDefaultAddress'), path: ['addresses'] }
    )
}

export type PartnerFormValues = z.infer<
  ReturnType<typeof makePartnerFormSchema>
>
