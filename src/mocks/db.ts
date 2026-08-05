import type { AuthCompany, AuthResponse, CurrentUser } from '@/features/auth/types/auth.types'
import type {
  Partner,
  PartnerBalance,
  PartnerTransaction,
} from '@/features/partners/types/partners.types'
import type { AccountTreeNode } from '@/features/accounts/types/accounts.types'
import type { Currency } from '@/features/currencies/types/currencies.types'
import type {
  Company,
  CompanySettings,
} from '@/features/companies/types/companies.types'

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

/** The same company as MOCK_COMPANY, in the fuller shape `/companies` returns.
 * Base currency is LBP on purpose: it's the zero-decimal case, so the mock
 * exercises the formatting path that a USD-only fixture would hide. */
export const MOCK_COMPANIES: Company[] = [
  {
    id: MOCK_COMPANY.id,
    name: MOCK_COMPANY.name,
    taxNumber: '1234567',
    phone: '+961 1 000 000',
    email: 'finance@demo.example.com',
    logo: null,
    isActive: true,
    baseCurrencyCode: 'LBP',
    fiscalYearStartMonth: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  baseCurrencyCode: 'LBP',
  fiscalYearStartMonth: 1,
  rounding: { decimals: 2, mode: 'HALF_UP' },
  defaultTemplates: {},
  enabledModules: ['gl', 'partners', 'accounts'],
  featureFlags: {},
  fieldVisibility: {},
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

/** Decimal places are real data here, not filler: LBP is a zero-decimal
 * currency, and formatMoney relies on this to avoid rendering "1,250.00 LBP". */
export const MOCK_CURRENCIES: Currency[] = [
  cur('USD', 'US Dollar', '$', 2),
  cur('LBP', 'Lebanese Pound', 'L£', 0),
  cur('EUR', 'Euro', '€', 2),
]

function cur(
  code: string,
  name: string,
  symbol: string,
  decimalPlaces: number
): Currency {
  return {
    code,
    name,
    nameAr: null,
    nameFr: null,
    nameEn: name,
    symbol,
    decimalPlaces,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

/**
 * A miniature chart of accounts, shaped as the TREE the real API returns from
 * `/accounts/tree` — parents with nested `children`. The flat `/accounts` list
 * is derived from this (see handlers.ts) rather than kept as a second literal,
 * so the two endpoints can't disagree about what accounts exist.
 */
function acc(
  partial: Pick<AccountTreeNode, 'id' | 'number' | 'name' | 'accountClass' | 'type' | 'normalBalance'> &
    Partial<AccountTreeNode>
): AccountTreeNode {
  return {
    companyId: 'company-1',
    nameAr: null,
    nameFr: null,
    nameEn: null,
    parentId: null,
    currencyRestriction: null,
    isControl: false,
    controlType: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    children: [],
    ...partial,
  }
}

export const MOCK_ACCOUNT_TREE: AccountTreeNode[] = [
  acc({
    id: 'acc-1000-root', number: '1', name: 'Assets', nameAr: 'الأصول', nameFr: 'Actifs', nameEn: 'Assets',
    accountClass: 1, type: 'ASSET', normalBalance: 'DEBIT',
    children: [
      acc({ id: 'acc-1000', number: '1000', name: 'Cash on hand', nameFr: 'Caisse', accountClass: 1, type: 'ASSET', normalBalance: 'DEBIT', parentId: 'acc-1000-root', isControl: true, controlType: 'CASH' }),
      acc({ id: 'acc-1010', number: '1010', name: 'Bank — main operating account', nameFr: 'Banque', accountClass: 1, type: 'ASSET', normalBalance: 'DEBIT', parentId: 'acc-1000-root', isControl: true, controlType: 'BANK' }),
      acc({
        id: 'acc-1100', number: '1100', name: 'Accounts Receivable — Control', nameAr: 'العملاء', nameFr: 'Clients',
        accountClass: 1, type: 'ASSET', normalBalance: 'DEBIT', parentId: 'acc-1000-root', isControl: true, controlType: 'AR',
        children: [
          acc({ id: 'acc-1101', number: '1101', name: 'Accounts Receivable — VIP customers', accountClass: 1, type: 'ASSET', normalBalance: 'DEBIT', parentId: 'acc-1100' }),
        ],
      }),
    ],
  }),
  acc({
    id: 'acc-2000-root', number: '2', name: 'Liabilities', nameAr: 'الخصوم', nameFr: 'Passifs', nameEn: 'Liabilities',
    accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT',
    children: [
      acc({
        id: 'acc-2100', number: '2100', name: 'Accounts Payable — Control', nameAr: 'الموردون', nameFr: 'Fournisseurs',
        accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', parentId: 'acc-2000-root', isControl: true, controlType: 'AP',
        children: [
          acc({ id: 'acc-2101', number: '2101', name: 'Accounts Payable — Preferred suppliers', accountClass: 2, type: 'LIABILITY', normalBalance: 'CREDIT', parentId: 'acc-2100', isActive: false }),
        ],
      }),
    ],
  }),
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
    baseCurrency: 'USD',
    totalDebitBase: 0,
    totalCreditBase: 0,
    balanceBase: 0,
    byBaseCurrency: [],
    byCurrency: [],
    presentation: null,
  }
}

/** No Invoicing yet — only a manually-tagged journal entry would populate
 * this, so every mock partner starts with an empty ledger. Expected, not a
 * bug (see instructions doc §3 Partner Detail → Ledger tab). */
export const partnerTransactionsDb: Record<string, PartnerTransaction[]> = {}
