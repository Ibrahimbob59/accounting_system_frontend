import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  ClipboardList,
  FileText,
  Package,
  Receipt,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { usePartnersCount } from '@/features/dashboard/hooks/usePartnersCount'
import { useUsersCount } from '@/features/dashboard/hooks/useUsersCount'
import { useAccountsCount } from '@/features/dashboard/hooks/useAccountsCount'
import {
  useItemsCount,
  usePaymentsCount,
  usePurchaseOrdersCount,
  useSalesInvoicesCount,
  useVendorBillsCount,
} from '@/features/dashboard/hooks/useDashboardCounts'

/**
 * The `/app` index page. Company-scoped stat cards for a normal user; a plain
 * "Platform admin" state for an admin with no active company (§5) — the
 * per-company counts don't apply to them, so we don't force the cards to render
 * against a null company.
 */
export function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const user = useAuthStore((s) => s.user)
  const companies = useAuthStore((s) => s.companies)
  const isPlatformAdmin = companies.length === 0

  // Skip the company-scoped calls entirely for a platform admin.
  const active = !isPlatformAdmin
  const partners = usePartnersCount(active)
  const users = useUsersCount(active)
  const accounts = useAccountsCount(active)
  const items = useItemsCount(active)
  const salesInvoices = useSalesInvoicesCount(active)
  const purchaseOrders = usePurchaseOrdersCount(active)
  const vendorBills = useVendorBillsCount(active)
  const payments = usePaymentsCount(active)

  if (isPlatformAdmin) {
    return (
      <div>
        <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
          {t('platformAdmin.title')}
        </h1>
        <p className="mt-2 text-text-secondary">{t('platformAdmin.body')}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-[length:var(--h1-size)] font-bold tracking-[-0.02em] text-text-primary">
        {user?.firstName
          ? t('welcome', { name: user.firstName })
          : t('welcomeGeneric')}
      </h1>
      <p className="mt-2 text-[15px] text-text-muted">{t('welcomeSubtitle')}</p>

      <div className="mt-9 grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t('cards.partners')}
          icon={Users}
          value={partners.data}
          isLoading={partners.isLoading}
          isError={partners.isError}
        />
        <StatCard
          label={t('cards.users')}
          icon={UsersRound}
          value={users.data}
          isLoading={users.isLoading}
          isError={users.isError}
        />
        <StatCard
          label={t('cards.accounts')}
          icon={BookOpen}
          value={accounts.data}
          isLoading={accounts.isLoading}
          isError={accounts.isError}
        />
        <StatCard
          label={t('cards.items')}
          icon={Package}
          value={items.data}
          isLoading={items.isLoading}
          isError={items.isError}
        />
        <StatCard
          label={t('cards.salesInvoices')}
          icon={FileText}
          value={salesInvoices.data}
          isLoading={salesInvoices.isLoading}
          isError={salesInvoices.isError}
        />
        <StatCard
          label={t('cards.purchaseOrders')}
          icon={ClipboardList}
          value={purchaseOrders.data}
          isLoading={purchaseOrders.isLoading}
          isError={purchaseOrders.isError}
        />
        <StatCard
          label={t('cards.vendorBills')}
          icon={Receipt}
          value={vendorBills.data}
          isLoading={vendorBills.isLoading}
          isError={vendorBills.isError}
        />
        <StatCard
          label={t('cards.payments')}
          icon={Wallet}
          value={payments.data}
          isLoading={payments.isLoading}
          isError={payments.isError}
        />
      </div>
    </div>
  )
}
