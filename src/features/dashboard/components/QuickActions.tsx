import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookText,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileText,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import {
  usePermission,
  type PermissionKey,
} from '@/features/auth/lib/permissions'

interface Action {
  key: string
  to: string
  icon: LucideIcon
  permission: PermissionKey
}

const ACTIONS: Action[] = [
  {
    key: 'newSalesInvoice',
    to: '/app/sales-invoices/new',
    icon: FileText,
    permission: 'sales.create',
  },
  {
    key: 'newPayment',
    to: '/app/payments/new',
    icon: Wallet,
    permission: 'payment.create',
  },
  {
    key: 'newPurchaseOrder',
    to: '/app/purchase-orders/new',
    icon: ClipboardList,
    permission: 'purchase.create',
  },
  {
    key: 'newStockCount',
    to: '/app/stock-counts/new',
    icon: ClipboardCheck,
    permission: 'stock.create',
  },
  {
    key: 'newJournalEntry',
    to: '/app/journal-entries/new',
    icon: BookText,
    permission: 'journalentry.create',
  },
  {
    key: 'newPartner',
    to: '/app/partners/new',
    icon: Contact,
    permission: 'partner.create',
  },
]

/** Row of primary create actions, each gated by its permission. */
export function QuickActions() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((a) => (
        <ActionButton
          key={a.key}
          action={a}
          label={t(`quickActions.${a.key}`)}
        />
      ))}
    </div>
  )
}

function ActionButton({ action, label }: { action: Action; label: string }) {
  const allowed = usePermission(action.permission)
  if (!allowed) return null
  const Icon = action.icon
  return (
    <Link
      to={action.to}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand hover:text-brand"
    >
      <span className="relative flex items-center">
        <Icon className="size-4" />
        <Plus className="size-2.5 -ms-1 -mt-2" />
      </span>
      {label}
    </Link>
  )
}
