import { z } from 'zod'
import type { TFunction } from 'i18next'

/**
 * Demo-request form schema, mirroring the backend CreateDemoRequestDto
 * field-for-field (API-CONTRACTS.md → Leads). Optional fields accept an empty
 * string from the inputs and are stripped to `undefined` before submit.
 */
export function makeDemoRequestSchema(t: TFunction<'leads'>) {
  const optional = (max: number) =>
    z.string().trim().max(max).optional().or(z.literal(''))

  return z.object({
    fullName: z.string().trim().min(1, t('validation.required')).max(200),
    workEmail: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid'))
      .max(255),
    companyName: z.string().trim().min(1, t('validation.required')).max(255),
    phone: optional(50),
    companySize: z.string().optional().or(z.literal('')),
    message: optional(2000),
  })
}

export type DemoRequestForm = z.infer<ReturnType<typeof makeDemoRequestSchema>>

/** Payload actually sent to POST /leads/demo-request. */
export interface DemoRequestBody {
  fullName: string
  workEmail: string
  companyName: string
  phone?: string
  companySize?: string
  message?: string
}

export interface DemoRequestResponse {
  message: string
}

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+'] as const
