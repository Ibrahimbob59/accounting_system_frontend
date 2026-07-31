import { http, HttpResponse } from 'msw'

import {
  MOCK_ACCOUNTS,
  MOCK_CREDENTIALS,
  MOCK_CURRENCIES,
  MOCK_USER,
  buildAuthResponse,
  buildPartnerBalance,
  nextPartnerRef,
  partnerTransactionsDb,
  partnersDb,
} from '@/mocks/db'
import type { ApiErrorBody } from '@/types/api'
import type {
  Partner,
  PartnerAddress,
  PartnerAddressInput,
} from '@/features/partners/types/partners.types'

// TODO(backend): delete this whole mocks/ directory once the real API is up —
// see src/mocks/README.md.

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api/v1'
const url = (path: string) => `${API_BASE}${path}`

function ok<T>(data: T) {
  return HttpResponse.json({ data, meta: null })
}

function page<T>(data: T, meta: { total: number; page: number; limit: number }) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit))
  return HttpResponse.json({ data, meta: { ...meta, totalPages } })
}

function fail(status: number, code: string, message: string, field: string | null = null) {
  const body: ApiErrorBody = { data: null, error: { code, message, field } }
  return HttpResponse.json(body, { status })
}

let addressCounter = 0
function toAddress(input: PartnerAddressInput): PartnerAddress {
  addressCounter += 1
  return {
    id: `addr-${addressCounter}`,
    type: input.type,
    line1: input.line1,
    city: input.city || null,
    country: input.country || null,
    region: input.region || null,
    phone: input.phone || null,
    isDefault: !!input.isDefault,
  }
}

export const handlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email !== MOCK_CREDENTIALS.email || body.password !== MOCK_CREDENTIALS.password) {
      return fail(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password.')
    }
    return ok(buildAuthResponse())
  }),

  http.post(url('/auth/register'), async () => {
    return ok(buildAuthResponse())
  }),

  http.post(url('/auth/refresh'), async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string }
    if (!body.refreshToken) return fail(401, 'INVALID_REFRESH_TOKEN', 'Missing refresh token.')
    return ok(buildAuthResponse())
  }),

  http.get(url('/auth/me'), () => {
    return ok(MOCK_USER)
  }),

  http.post(url('/auth/change-password'), () => {
    return ok(buildAuthResponse({ mustChangePassword: false }))
  }),

  http.post(url('/auth/switch-company'), async ({ request }) => {
    const body = (await request.json()) as { companyId?: string }
    return ok(buildAuthResponse({ activeCompanyId: body.companyId ?? null }))
  }),

  http.post(url('/auth/forgot-password'), () => {
    return ok(null)
  }),

  http.post(url('/auth/verify-reset-code'), async ({ request }) => {
    const body = (await request.json()) as { code?: string }
    if (body.code !== '123456') {
      return fail(400, 'INVALID_RESET_CODE', 'Invalid or expired code.', 'code')
    }
    return ok(null)
  }),

  http.post(url('/auth/reset-password'), async ({ request }) => {
    const body = (await request.json()) as { code?: string }
    if (body.code !== '123456') {
      return fail(400, 'INVALID_RESET_CODE', 'Invalid or expired code.', 'code')
    }
    return ok(null)
  }),

  http.post(url('/auth/logout'), () => {
    return ok(null)
  }),

  // ---- Dashboard counts (users has no real feature yet) ---------------------
  http.get(url('/users'), () => page([], { total: 3, page: 1, limit: 1 })),

  // ---- Partners ---------------------------------------------------------
  http.get(url('/partners/:id/balance'), ({ params }) => {
    const partner = partnersDb.find((p) => p.id === params.id)
    if (!partner) return fail(404, 'PARTNER_NOT_FOUND', 'Partner not found.')
    return ok(buildPartnerBalance(partner))
  }),

  http.get(url('/partners/:id/transactions'), ({ params, request }) => {
    const partner = partnersDb.find((p) => p.id === params.id)
    if (!partner) return fail(404, 'PARTNER_NOT_FOUND', 'Partner not found.')
    const search = new URL(request.url).searchParams
    const pageNum = Number(search.get('page') ?? '1')
    const limit = Number(search.get('limit') ?? '20')
    const all = partnerTransactionsDb[partner.id] ?? []
    const start = (pageNum - 1) * limit
    return page(all.slice(start, start + limit), {
      total: all.length,
      page: pageNum,
      limit,
    })
  }),

  http.get(url('/partners/:id'), ({ params }) => {
    const partner = partnersDb.find((p) => p.id === params.id)
    if (!partner) return fail(404, 'PARTNER_NOT_FOUND', 'Partner not found.')
    return ok(partner)
  }),

  http.get(url('/partners'), ({ request }) => {
    const search = new URL(request.url).searchParams
    let rows = partnersDb.slice()

    const isCustomer = search.get('isCustomer')
    if (isCustomer !== null) rows = rows.filter((p) => p.isCustomer === (isCustomer === 'true'))
    const isSupplier = search.get('isSupplier')
    if (isSupplier !== null) rows = rows.filter((p) => p.isSupplier === (isSupplier === 'true'))
    const isActive = search.get('isActive')
    if (isActive !== null) rows = rows.filter((p) => p.isActive === (isActive === 'true'))

    const q = search.get('q')?.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (p) =>
          p.ref.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.tin ?? '').toLowerCase().includes(q)
      )
    }

    const sortBy = (search.get('sortBy') ?? 'ref') as keyof Partner
    const sortOrder = search.get('sortOrder') === 'desc' ? -1 : 1
    rows.sort((a, b) => {
      const av = String(a[sortBy] ?? '')
      const bv = String(b[sortBy] ?? '')
      return av < bv ? -sortOrder : av > bv ? sortOrder : 0
    })

    const pageNum = Number(search.get('page') ?? '1')
    const limit = Number(search.get('limit') ?? '20')
    const start = (pageNum - 1) * limit
    const rowsWithoutAddresses = rows.map((p) => {
      const copy = { ...p }
      delete copy.addresses
      return copy
    })

    return page(rowsWithoutAddresses.slice(start, start + limit), {
      total: rows.length,
      page: pageNum,
      limit,
    })
  }),

  http.post(url('/partners'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const isCustomer = !!body.isCustomer
    const isSupplier = !!body.isSupplier
    if (!isCustomer && !isSupplier) {
      return fail(400, 'PARTNER_ROLE_REQUIRED', 'Select Customer and/or Supplier.', 'isCustomer')
    }

    let ref = typeof body.ref === 'string' && body.ref.trim() ? body.ref.trim() : ''
    if (ref && partnersDb.some((p) => p.ref.toLowerCase() === ref.toLowerCase())) {
      return fail(409, 'PARTNER_REF_ALREADY_EXISTS', 'That reference is already in use.', 'ref')
    }
    if (!ref) ref = nextPartnerRef()

    const addresses = Array.isArray(body.addresses)
      ? (body.addresses as PartnerAddressInput[]).map(toAddress)
      : []

    const nowIso = new Date().toISOString()
    const partner: Partner = {
      id: `partner-${Date.now()}`,
      companyId: MOCK_USER.companyId ?? 'mock-company-1',
      ref,
      name: String(body.name ?? ''),
      nameAr: (body.nameAr as string) || null,
      nameFr: (body.nameFr as string) || null,
      nameEn: (body.nameEn as string) || null,
      isCustomer,
      isSupplier,
      category: (body.category as string) || null,
      tin: (body.tin as string) || null,
      contactName: (body.contactName as string) || null,
      phone: (body.phone as string) || null,
      phone2: (body.phone2 as string) || null,
      email: (body.email as string) || null,
      vip: !!body.vip,
      creditLimit: typeof body.creditLimit === 'number' ? body.creditLimit : null,
      creditCurrency: (body.creditCurrency as string) || null,
      receivableAccountId: (body.receivableAccountId as string) || null,
      payableAccountId: (body.payableAccountId as string) || null,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      addresses,
    }
    partnersDb.push(partner)
    return ok(partner)
  }),

  http.patch(url('/partners/:id'), async ({ params, request }) => {
    const partner = partnersDb.find((p) => p.id === params.id)
    if (!partner) return fail(404, 'PARTNER_NOT_FOUND', 'Partner not found.')

    const body = (await request.json()) as Record<string, unknown>

    if (typeof body.ref === 'string' && body.ref.trim()) {
      const nextRef = body.ref.trim()
      const clashes = partnersDb.some(
        (p) => p.id !== partner.id && p.ref.toLowerCase() === nextRef.toLowerCase()
      )
      if (clashes) {
        return fail(409, 'PARTNER_REF_ALREADY_EXISTS', 'That reference is already in use.', 'ref')
      }
      partner.ref = nextRef
    }

    const nextIsCustomer = body.isCustomer ?? partner.isCustomer
    const nextIsSupplier = body.isSupplier ?? partner.isSupplier
    if (!nextIsCustomer && !nextIsSupplier) {
      return fail(400, 'PARTNER_ROLE_REQUIRED', 'Select Customer and/or Supplier.', 'isCustomer')
    }
    partner.isCustomer = !!nextIsCustomer
    partner.isSupplier = !!nextIsSupplier

    const str = (key: string) => (body[key] as string) || null
    if ('name' in body) partner.name = String(body.name ?? partner.name)
    if ('nameAr' in body) partner.nameAr = str('nameAr')
    if ('nameFr' in body) partner.nameFr = str('nameFr')
    if ('nameEn' in body) partner.nameEn = str('nameEn')
    if ('category' in body) partner.category = str('category')
    if ('tin' in body) partner.tin = str('tin')
    if ('contactName' in body) partner.contactName = str('contactName')
    if ('phone' in body) partner.phone = str('phone')
    if ('phone2' in body) partner.phone2 = str('phone2')
    if ('email' in body) partner.email = str('email')
    if ('creditCurrency' in body) partner.creditCurrency = str('creditCurrency')
    if ('receivableAccountId' in body) partner.receivableAccountId = str('receivableAccountId')
    if ('payableAccountId' in body) partner.payableAccountId = str('payableAccountId')
    if ('vip' in body) partner.vip = !!body.vip
    if ('isActive' in body) partner.isActive = !!body.isActive
    if ('creditLimit' in body) {
      partner.creditLimit = typeof body.creditLimit === 'number' ? body.creditLimit : null
    }
    // Supplying addresses REPLACES the whole set, per the instructions doc.
    if (Array.isArray(body.addresses)) {
      partner.addresses = (body.addresses as PartnerAddressInput[]).map(toAddress)
    }
    partner.updatedAt = new Date().toISOString()

    return ok(partner)
  }),

  http.delete(url('/partners/:id'), ({ params }) => {
    const index = partnersDb.findIndex((p) => p.id === params.id)
    if (index === -1) return fail(404, 'PARTNER_NOT_FOUND', 'Partner not found.')
    partnersDb.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- Currencies / Accounts (no dedicated feature yet — see partners.api.ts) ----
  http.get(url('/currencies'), () => ok(MOCK_CURRENCIES)),

  http.get(url('/accounts'), () =>
    page(MOCK_ACCOUNTS, { total: MOCK_ACCOUNTS.length, page: 1, limit: MOCK_ACCOUNTS.length })
  ),

  // ---- Invitations ----------------------------------------------------------
  http.post(url('/invitations/accept'), () => {
    return ok({ isNewUser: false })
  }),

  // ---- Leads ------------------------------------------------------------
  http.post(url('/leads/demo-request'), () => {
    return ok({ message: 'Thanks! We will be in touch shortly.' })
  }),
]
