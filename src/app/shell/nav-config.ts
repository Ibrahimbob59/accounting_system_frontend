import {
  ArrowLeftRight,
  BookOpen,
  BookText,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileMinus,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart,
  Package,
  PackageCheck,
  Percent,
  Receipt,
  Ruler,
  Scale,
  ScrollText,
  Tags,
  UsersRound,
  Wallet,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  /** i18n key in `namespace:key` form, e.g. 'shell:nav.dashboard' — the colon
   * form resolves regardless of the active default namespace. */
  labelKey: string
  path: string
  icon: LucideIcon
  /** Match this route as active only on an exact path match (index routes). */
  end?: boolean
}

export interface NavGroup {
  /** i18n key for the group heading; null for the top (ungrouped) section. */
  labelKey: string | null
  items: NavItem[]
}

/**
 * The sidebar's single source of truth, organised into logical groups.
 * Sidebar.tsx renders purely from this array — adding a section or moving an
 * item is an edit here, never a change to Sidebar itself. Do NOT add an entry
 * before its page actually exists.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [
      {
        labelKey: 'shell:nav.dashboard',
        path: '/app',
        icon: LayoutDashboard,
        end: true,
      },
      {
        // `Contact` (an address-card glyph), not `Users` — Partners are external
        // customers/suppliers, distinct from the internal Team.
        labelKey: 'shell:nav.partners',
        path: '/app/partners',
        icon: Contact,
      },
    ],
  },
  {
    labelKey: 'shell:nav.groups.sales',
    items: [
      {
        labelKey: 'shell:nav.salesInvoices',
        path: '/app/sales-invoices',
        icon: FileText,
      },
      {
        labelKey: 'shell:nav.creditNotes',
        path: '/app/credit-notes',
        icon: FileMinus,
      },
    ],
  },
  {
    labelKey: 'shell:nav.groups.purchasing',
    items: [
      {
        labelKey: 'shell:nav.purchaseOrders',
        path: '/app/purchase-orders',
        icon: ClipboardList,
      },
      {
        labelKey: 'shell:nav.goodsReceipts',
        path: '/app/goods-receipts',
        icon: PackageCheck,
      },
      {
        labelKey: 'shell:nav.vendorBills',
        path: '/app/vendor-bills',
        icon: Receipt,
      },
    ],
  },
  {
    labelKey: 'shell:nav.groups.inventory',
    items: [
      { labelKey: 'shell:nav.items', path: '/app/items', icon: Package },
      { labelKey: 'shell:nav.catalog', path: '/app/catalog', icon: Tags },
      { labelKey: 'shell:nav.uom', path: '/app/uom', icon: Ruler },
      { labelKey: 'shell:nav.stock', path: '/app/stock', icon: Warehouse },
      {
        labelKey: 'shell:nav.stockCounts',
        path: '/app/stock-counts',
        icon: ClipboardCheck,
      },
      {
        labelKey: 'shell:nav.stockTransfers',
        path: '/app/stock-transfers',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    labelKey: 'shell:nav.groups.accounting',
    items: [
      { labelKey: 'shell:nav.accounts', path: '/app/accounts', icon: BookOpen },
      {
        labelKey: 'shell:nav.journalEntries',
        path: '/app/journal-entries',
        icon: BookText,
      },
      { labelKey: 'shell:nav.payments', path: '/app/payments', icon: Wallet },
    ],
  },
  {
    labelKey: 'shell:nav.groups.reports',
    items: [
      {
        labelKey: 'shell:nav.trialBalance',
        path: '/app/reports/trial-balance',
        icon: Scale,
      },
      {
        labelKey: 'shell:nav.vatReturn',
        path: '/app/reports/vat-return',
        icon: Percent,
      },
      {
        labelKey: 'shell:nav.generalLedger',
        path: '/app/reports/general-ledger',
        icon: ScrollText,
      },
      {
        labelKey: 'shell:nav.incomeStatement',
        path: '/app/reports/income-statement',
        icon: LineChart,
      },
      {
        labelKey: 'shell:nav.balanceSheet',
        path: '/app/reports/balance-sheet',
        icon: Landmark,
      },
    ],
  },
  {
    labelKey: 'shell:nav.groups.settings',
    items: [
      { labelKey: 'shell:nav.users', path: '/app/users', icon: UsersRound },
      {
        labelKey: 'shell:nav.companies',
        path: '/app/companies',
        icon: Building2,
      },
    ],
  },
]

/** Flat list of every nav item, for any consumer that doesn't care about groups. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
