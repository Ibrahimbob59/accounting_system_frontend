import { z } from 'zod'
import type { TFunction } from 'i18next'

// -----------------------------------------------------------------------------
// Domain types — confirmed against the backend's companies.controller.ts + DTOs.
// -----------------------------------------------------------------------------

export interface Company {
  id: string
  name: string
  taxNumber: string | null
  phone: string | null
  email: string | null
  logo: string | null
  isActive: boolean
  /** Also exposed on the settings endpoint. Present here so the list and
   * detail screens can show it without a second request per company. */
  baseCurrencyCode: string
  /** 1–12. A fiscal year starting in January is 1. */
  fiscalYearStartMonth: number
  createdAt: string
  updatedAt: string
}

export const ROUNDING_MODES = [
  'HALF_UP',
  'HALF_DOWN',
  'HALF_EVEN',
  'UP',
  'DOWN',
] as const
export type RoundingMode = (typeof ROUNDING_MODES)[number]

export interface RoundingSetting {
  decimals: number
  mode: RoundingMode
}

/**
 * `GET /companies/:id/settings`. Wider than the company record: it adds the
 * operational knobs (rounding, enabled modules, feature flags, field
 * visibility) on top of the two fields the company itself also carries.
 */
export interface CompanySettings {
  baseCurrencyCode: string
  fiscalYearStartMonth: number
  rounding: RoundingSetting
  defaultTemplates: Record<string, string>
  enabledModules: string[]
  featureFlags: Record<string, boolean>
  fieldVisibility: Record<string, boolean>
}

/**
 * What `PATCH /companies/:id/settings` accepts.
 *
 * `baseCurrencyCode` and `fiscalYearStartMonth` are Company columns rather
 * than settings-JSON keys, but the endpoint accepts them so its read and write
 * shapes match — the GET has always returned them. (Backend commit 967e995;
 * before it they were silently stripped by `whitelist: true`, so a save
 * appeared to succeed and reverted on the next read.) `PATCH /companies/:id`
 * sets them too.
 */
export interface UpdateCompanySettingsDto {
  baseCurrencyCode?: string
  fiscalYearStartMonth?: number
  rounding?: RoundingSetting
  defaultTemplates?: Record<string, string>
  enabledModules?: string[]
  featureFlags?: Record<string, boolean>
  fieldVisibility?: Record<string, boolean>
}

export interface CreateCompanyDto {
  name: string
  taxNumber?: string
  phone?: string
  email?: string
  logo?: string
  baseCurrencyCode?: string
  fiscalYearStartMonth?: number
  /** Platform-admin only — attaches the new company to another user. A normal
   * caller becomes the owner automatically and must not send this. */
  ownerUserId?: string
}

/** `UpdateCompanyDto = PartialType(CreateCompanyDto)`. */
export type UpdateCompanyDto = Partial<CreateCompanyDto>

export interface ListCompaniesQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 1-based, matching `fiscalYearStartMonth`. Rendered through `toLocaleString`
 * so month names follow the active language rather than being translated by
 * hand in three files. */
export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export function monthName(month: number, locale: string): string {
  // Day 1 of an arbitrary non-leap year — only the month matters.
  return new Date(2025, month - 1, 1).toLocaleString(locale, { month: 'long' })
}

// -----------------------------------------------------------------------------
// Form schemas
// -----------------------------------------------------------------------------

export function makeCompanySchema(t: TFunction<'companies'>) {
  return z.object({
    name: z.string().min(1, t('validation.required')),
    taxNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .email(t('validation.emailInvalid'))
      .optional()
      .or(z.literal('')),
    baseCurrencyCode: z.string().min(1, t('validation.required')),
    fiscalYearStartMonth: z
      .number({ message: t('validation.required') })
      .int()
      .min(1)
      .max(12),
  })
}

export type CompanyFormValues = z.infer<ReturnType<typeof makeCompanySchema>>

export function makeSettingsSchema(t: TFunction<'companies'>) {
  return z.object({
    baseCurrencyCode: z.string().min(1, t('validation.required')),
    fiscalYearStartMonth: z
      .number({ message: t('validation.required') })
      .int()
      .min(1)
      .max(12),
    roundingDecimals: z
      .number({ message: t('validation.required') })
      .int()
      .min(0, t('validation.decimalsRange'))
      .max(6, t('validation.decimalsRange')),
    roundingMode: z.enum(ROUNDING_MODES),
  })
}

export type SettingsFormValues = z.infer<ReturnType<typeof makeSettingsSchema>>
