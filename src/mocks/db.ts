import type { AuthCompany, AuthResponse, CurrentUser } from '@/features/auth/types/auth.types'
import type {
  Account,
  Currency,
  Partner,
  PartnerBalance,
  PartnerTransaction,
} from '@/features/partners/types/partners.types'

// TODO(backend): delete this whole mocks/ directory once the real API is up —
// see src/mocks/README.md.

// LoginPage validates client-side (valid email format, password >= 8 chars),
// so credentials have to satisfy that even in mock mode.
export const MOCK_CREDENTIALS = {
  email: '1@1.com',
  password: '11111111',
}

const MOCK_COMPANY: AuthCompany = {
  id: 'mock-company-1',
  name: 'Demo Company',
}

export const MOCK_USER: CurrentUser = {
  id: 'mock-user-1',
  firstName: 'Dev',
  lastName: 'User',
  email: MOCK_CREDENTIALS.email,
  companyId: MOCK_COMPANY.id,
  preferredLanguage: 'EN',
  avatarUrl: null,
  activeCompanyId: MOCK_COMPANY.id,
  companies: [MOCK_COMPANY],
  mustChangePassword: false,
}

let tokenCounter = 0

/** Cheap fake tokens — never decoded, just round-tripped as opaque strings. */
export function issueTokens() {
  tokenCounter += 1
  return {
    accessToken: `mock-access-token-${tokenCounter}`,
    refreshToken: `mock-refresh-token-${tokenCounter}`,
    tokenType: 'Bearer' as const,
    expiresIn: 900,
  }
}

export function buildAuthResponse(
  overrides: Partial<Pick<AuthResponse, 'activeCompanyId' | 'mustChangePassword'>> = {}
): AuthResponse {
  return {
    ...issueTokens(),
    companies: MOCK_USER.companies,
    activeCompanyId: overrides.activeCompanyId ?? MOCK_USER.activeCompanyId,
    mustChangePassword: overrides.mustChangePassword ?? false,
  }
}

// ---------------------------------------------------------------------------
// Partners module fixtures
// ---------------------------------------------------------------------------

export const MOCK_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'EUR', name: 'Euro' },
]

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc-1100', number: '1100', name: 'Accounts Receivable — Control' },
  { id: 'acc-2100', number: '2100', name: 'Accounts Payable — Control' },
  { id: 'acc-1101', number: '1101', name: 'Accounts Receivable — VIP customers' },
  { id: 'acc-2101', number: '2101', name: 'Accounts Payable — Preferred suppliers' },
  { id: 'acc-1000', number: '1000', name: 'Cash on hand' },
  { id: 'acc-1010', number: '1010', name: 'Bank — main operating account' },
]

let partnerCounter = 0
const now = () => new Date().toISOString()

function makePartner(overrides: Partial<Partner> = {}): Partner {
  partnerCounter += 1
  const id = overrides.id ?? `partner-${partnerCounter}`
  return {
    id,
    companyId: MOCK_USER.companyId ?? 'mock-company-1',
    ref: `P-${String(partnerCounter).padStart(4, '0')}`,
    name: `Partner ${partnerCounter}`,
    nameAr: null,
    nameFr: null,
    nameEn: null,
    isCustomer: true,
    isSupplier: false,
    category: null,
    tin: null,
    contactName: null,
    phone: null,
    phone2: null,
    email: null,
    vip: false,
    creditLimit: null,
    creditCurrency: null,
    receivableAccountId: null,
    payableAccountId: null,
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
    addresses: [],
    ...overrides,
  }
}

export const partnersDb: Partner[] = [
  makePartner({
    name: 'Beirut Trading Co.',
    isCustomer: true,
    isSupplier: false,
    vip: true,
    contactName: 'Nour Khalil',
    phone: '+961 1 234 567',
    email: 'nour@beiruttrading.example',
    creditLimit: 5000,
    creditCurrency: 'USD',
    addresses: [
      {
        id: 'addr-1',
        type: 'BILLING',
        line1: 'Hamra Street 12',
        city: 'Beirut',
        country: 'Lebanon',
        region: null,
        phone: '+961 1 234 567',
        isDefault: true,
      },
    ],
  }),
  makePartner({
    name: 'Cedar Supplies SARL',
    isCustomer: false,
    isSupplier: true,
    contactName: 'Elie Frangieh',
    phone: '+961 3 987 654',
    email: 'elie@cedarsupplies.example',
  }),
  makePartner({
    name: 'Levant Import/Export',
    isCustomer: true,
    isSupplier: true,
    vip: false,
    isActive: false,
  }),
]

export function nextPartnerRef(): string {
  partnerCounter += 1
  return `P-${String(partnerCounter).padStart(4, '0')}`
}

export function buildPartnerBalance(partner: Partner): PartnerBalance {
  return {
    partnerId: partner.id,
    ref: partner.ref,
    name: partner.name,
    asOf: now().slice(0, 10),
    totalDebitBase: 0,
    totalCreditBase: 0,
    balanceBase: 0,
    byCurrency: [],
  }
}

/** No Invoicing yet — only a manually-tagged journal entry would populate
 * this, so every mock partner starts with an empty ledger. Expected, not a
 * bug (see instructions doc §3 Partner Detail → Ledger tab). */
export const partnerTransactionsDb: Record<string, PartnerTransaction[]> = {}
